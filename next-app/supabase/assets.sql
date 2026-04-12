-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Assets (2026-04-12)
-- ════════════════════════════════════════════════════════════════
-- Per-person (groom / bride) financial assets and loan eligibility
-- info. Exactly 2 rows expected — one per role, upserted by the
-- frontend on save.
--
-- Idempotent & safe to re-run.

CREATE TABLE IF NOT EXISTS public.assets (
  id               BIGSERIAL PRIMARY KEY,
  role             TEXT NOT NULL UNIQUE CHECK (role IN ('groom', 'bride')),

  -- 자산 현황
  cash             INT  DEFAULT 0,   -- 현금 / 예금 (만원)
  stocks           INT  DEFAULT 0,   -- 주식 / 투자 (만원)
  savings          INT  DEFAULT 0,   -- 청약 / 적금 (만원)
  other_assets     INT  DEFAULT 0,   -- 기타 자산 (만원)
  other_note       TEXT DEFAULT '',   -- 기타 자산 설명

  -- 소득
  monthly_income   INT  DEFAULT 0,   -- 월 소득 (만원)
  annual_income    INT  DEFAULT 0,   -- 연 소득 (만원)

  -- 대출 심사 기본 정보
  age              INT  DEFAULT 0,   -- 나이
  is_homeless      BOOLEAN DEFAULT TRUE,   -- 무주택 여부
  homeless_years   INT  DEFAULT 0,         -- 무주택 기간 (년)
  is_first_home    BOOLEAN DEFAULT TRUE,   -- 생애최초 주택구입 여부
  existing_loans   INT  DEFAULT 0,         -- 기존 대출 총액 (만원)
  credit_score     INT  DEFAULT 0,         -- 신용점수
  net_assets       INT  DEFAULT 0,         -- 순자산 (만원)

  note             TEXT DEFAULT '',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;

-- Seed the two rows so the frontend can always upsert.
INSERT INTO public.assets (role) VALUES ('groom'), ('bride')
ON CONFLICT (role) DO NOTHING;

NOTIFY pgrst, 'reload schema';

-- Realtime: Supabase Dashboard → Database → Replication 에서
-- assets 테이블을 supabase_realtime publication에 수동 추가할 것.
