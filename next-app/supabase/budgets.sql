-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Budgets table
-- ════════════════════════════════════════════════════════════════
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run.
--
-- One row per category. Categories are fixed: hall, studio, dress,
-- makeup, etc. The UI upserts by category so there's never more than
-- five rows in this table.
--
-- Same RLS policy as `halls` — disabled. Auth is enforced at the
-- Next.js proxy layer.

CREATE TABLE IF NOT EXISTS public.budgets (
  category   TEXT PRIMARY KEY CHECK (category IN ('hall', 'studio', 'dress', 'makeup', 'etc')),
  budget     INT  NOT NULL DEFAULT 0,   -- 만원 단위 (10,000원)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache so the new table is immediately visible.
NOTIFY pgrst, 'reload schema';
