-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — 출퇴근 자동 계산 (다중 직장 지원, 2026-04-16)
-- ════════════════════════════════════════════════════════════════
-- Depends on: assets.sql, complexes.sql
--
-- assets.workplaces  — 각 사람마다 직장 배열 (JSONB)
--   [{ label: string, address: string, lat: number, lng: number }]
-- complexes.commutes — 매물별 출퇴근 결과 배열 (JSONB)
--   [{ role: 'groom'|'bride', label: string, minutes: number }]
--
-- 이전 단일-직장 스키마(workplace_address/lat/lng, commute1/2_minutes)가
-- 존재하면 JSONB로 자동 마이그레이션 후 드롭한다.
--
-- Idempotent & safe to re-run.

-- ── assets.workplaces (JSONB 배열) ────────────────────────────
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS workplaces JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assets'
      AND column_name = 'workplace_address'
  ) THEN
    -- 이전 단일 직장이 있으면 workplaces[0] 로 이관
    UPDATE public.assets
      SET workplaces = jsonb_build_array(
        jsonb_build_object(
          'label',   '본사',
          'address', COALESCE(workplace_address, ''),
          'lat',     workplace_lat,
          'lng',     workplace_lng
        )
      )
      WHERE workplace_lat IS NOT NULL
        AND workplace_lng IS NOT NULL
        AND (workplaces IS NULL OR workplaces = '[]'::jsonb);
    ALTER TABLE public.assets
      DROP COLUMN IF EXISTS workplace_address,
      DROP COLUMN IF EXISTS workplace_lat,
      DROP COLUMN IF EXISTS workplace_lng;
  END IF;
END $$;

-- ── complexes.commutes (JSONB 배열) ────────────────────────────
ALTER TABLE public.complexes
  ADD COLUMN IF NOT EXISTS commutes JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 이전 commute1/2_minutes가 있으면 그냥 드롭(개수 고정 단일 직장 전용이라 재계산 필요)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'complexes'
      AND column_name = 'commute1_minutes'
  ) THEN
    ALTER TABLE public.complexes
      DROP COLUMN IF EXISTS commute1_minutes,
      DROP COLUMN IF EXISTS commute2_minutes;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
