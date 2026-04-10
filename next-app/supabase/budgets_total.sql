-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Add `total` pseudo-category to budgets (2026-04-10)
-- ════════════════════════════════════════════════════════════════
-- Extends the CHECK constraint on public.budgets.category so it
-- accepts a sixth value: 'total'. This is a pseudo-category used to
-- store the user's overall budget target — the donut chart and
-- category editor iterate only the five real categories and treat
-- `total` specially.
--
-- Run once in Supabase Dashboard → SQL Editor → New Query → Run.
-- Safe to re-run.

DO $$
BEGIN
  -- Drop the existing constraint if present. The original inline
  -- constraint was auto-named `budgets_category_check` by Postgres.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.budgets'::regclass
      AND conname  = 'budgets_category_check'
  ) THEN
    ALTER TABLE public.budgets DROP CONSTRAINT budgets_category_check;
  END IF;

  ALTER TABLE public.budgets
    ADD CONSTRAINT budgets_category_check
    CHECK (category IN ('hall', 'studio', 'dress', 'makeup', 'etc', 'total'));
END $$;

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
