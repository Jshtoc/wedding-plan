-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Custom budget categories (2026-04-10)
-- ════════════════════════════════════════════════════════════════
-- Users can now add their own budget rows in addition to the fixed 5
-- (hall/studio/dress/makeup/etc) and the `total` pseudo-row. Custom
-- rows use a `category` key of the form "custom:<rand>" and store
-- their display name in the new `label` column.
--
-- This migration:
--   1) Drops the CHECK constraint on category (any text now allowed)
--   2) Adds a nullable `label` column (used only by custom rows)
--
-- Run once in Supabase Dashboard → SQL Editor → New Query → Run.
-- Safe to re-run — the DO block only drops the constraint if it's
-- still present, and ADD COLUMN is guarded by IF NOT EXISTS.
--
-- Depends on: budgets.sql (initial table) + budgets_total.sql
-- (the previous migration that already extended the constraint).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.budgets'::regclass
      AND conname  = 'budgets_category_check'
  ) THEN
    ALTER TABLE public.budgets DROP CONSTRAINT budgets_category_check;
  END IF;
END $$;

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS label TEXT;

-- Reload PostgREST schema cache so the new column is immediately visible.
NOTIFY pgrst, 'reload schema';
