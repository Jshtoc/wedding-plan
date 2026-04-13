-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Multi-tenant data isolation (2026-04-13)
-- ════════════════════════════════════════════════════════════════
-- Adds a `group_id` column to every data table so different user
-- groups (couples) see only their own data. Existing rows are
-- assigned to 'couple-1' (the original wed1/wed2 pair).
--
-- Run once in WebStorm. Safe to re-run (IF NOT EXISTS guards).
-- Depends on: all previous migrations.

-- ── Add group_id column to all 8 tables ────────────────────────
ALTER TABLE public.halls      ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';
ALTER TABLE public.budgets    ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';
ALTER TABLE public.events     ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';
ALTER TABLE public.studios    ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';
ALTER TABLE public.dresses    ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';
ALTER TABLE public.makeups    ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';
ALTER TABLE public.complexes  ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';
ALTER TABLE public.assets     ADD COLUMN IF NOT EXISTS group_id TEXT NOT NULL DEFAULT 'couple-1';

-- ── Update unique constraints for budgets + assets ─────────────
-- budgets: was PRIMARY KEY on category alone → composite (group_id, category)
-- We need to drop the old PK and create a new one.
DO $$
BEGIN
  -- budgets: drop old PK if it exists, create composite
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.budgets'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.budgets DROP CONSTRAINT budgets_pkey;
  END IF;

  -- Add id column if not exists (needed for new PK)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN id BIGSERIAL;
  END IF;

  -- New PK on id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.budgets'::regclass AND conname = 'budgets_pkey'
  ) THEN
    ALTER TABLE public.budgets ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);
  END IF;

  -- Unique on (group_id, category) for upsert
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.budgets'::regclass AND conname = 'budgets_group_category_key'
  ) THEN
    ALTER TABLE public.budgets ADD CONSTRAINT budgets_group_category_key UNIQUE (group_id, category);
  END IF;
END $$;

-- assets: drop old unique on role, create composite (group_id, role)
DO $$
BEGIN
  -- Drop old unique constraint on role (name may vary)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.assets'::regclass
      AND conname = 'assets_role_key'
  ) THEN
    ALTER TABLE public.assets DROP CONSTRAINT assets_role_key;
  END IF;

  -- Add composite unique
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.assets'::regclass AND conname = 'assets_group_role_key'
  ) THEN
    ALTER TABLE public.assets ADD CONSTRAINT assets_group_role_key UNIQUE (group_id, role);
  END IF;
END $$;

-- ── Indexes for query performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_halls_group      ON public.halls (group_id);
CREATE INDEX IF NOT EXISTS idx_budgets_group    ON public.budgets (group_id);
CREATE INDEX IF NOT EXISTS idx_events_group     ON public.events (group_id);
CREATE INDEX IF NOT EXISTS idx_studios_group    ON public.studios (group_id);
CREATE INDEX IF NOT EXISTS idx_dresses_group    ON public.dresses (group_id);
CREATE INDEX IF NOT EXISTS idx_makeups_group    ON public.makeups (group_id);
CREATE INDEX IF NOT EXISTS idx_complexes_group  ON public.complexes (group_id);
CREATE INDEX IF NOT EXISTS idx_assets_group     ON public.assets (group_id);

NOTIFY pgrst, 'reload schema';
