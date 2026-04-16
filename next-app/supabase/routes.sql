-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — 임장 동선 히스토리 (2026-04-16)
-- ════════════════════════════════════════════════════════════════
-- Depends on: multi_tenant.sql (for group_id column convention)
-- Stores saved 임장 route plans — a named snapshot of the route
-- planner state (start/end/stops order/time settings) so users can
-- reopen a past plan and see where they visited.
--
-- Idempotent & safe to re-run.

CREATE TABLE IF NOT EXISTS public.routes (
  id          BIGSERIAL PRIMARY KEY,
  group_id    TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',           -- 사용자가 지은 이름 (예: "4/20 토요일 임장")
  visited_at  DATE,                                -- 방문한 날짜 (nullable: 아직 안 다녀왔을 수 있음)
  payload     JSONB NOT NULL,                      -- { start, end, endSame, stops: number[], dep: "HH:MM", view: number, result? }
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;

-- 최근 저장 / 방문일 내림차순 조회가 기본
CREATE INDEX IF NOT EXISTS routes_group_id_idx ON public.routes(group_id);
CREATE INDEX IF NOT EXISTS routes_group_visited_idx
  ON public.routes(group_id, visited_at DESC NULLS LAST, created_at DESC);

NOTIFY pgrst, 'reload schema';

-- ── Realtime publication ───────────────────────────────────────
-- Pooler 연결에서는 ALTER PUBLICATION 권한이 없으므로, Supabase
-- Dashboard → Database → Replication 에서 routes 테이블을
-- supabase_realtime publication 에 수동 추가할 것.
