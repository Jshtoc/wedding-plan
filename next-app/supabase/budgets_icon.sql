-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Custom budget row icons + remove `etc` (2026-04-10)
-- ════════════════════════════════════════════════════════════════
-- Two changes:
--
--   1) Add a nullable `icon` column to public.budgets. It only matters
--      for custom rows; fixed rows (hall/studio/dress/makeup) use the
--      hardcoded icons from BUDGET_CATEGORIES in the frontend code.
--
--   2) Delete the existing `etc` row (if any). The fixed category was
--      removed from the UI per user request — users can now add a
--      "기타" custom row themselves with whatever name/icon they want.
--
-- Run once in Supabase Dashboard → SQL Editor → New Query → Run.
-- Depends on: budgets.sql, budgets_total.sql, budgets_custom.sql
-- (the previous migrations).

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- Clean up the retired `etc` fixed row.
DELETE FROM public.budgets WHERE category = 'etc';

-- Reload PostgREST schema cache so the new column is visible.
NOTIFY pgrst, 'reload schema';
