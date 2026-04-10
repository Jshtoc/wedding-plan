-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Vendors (studio / dress / makeup) (2026-04-10)
-- ════════════════════════════════════════════════════════════════
-- Three tables sharing a uniform schema so the frontend can drive
-- them through a single generic component. Dress gets an extra
-- `target` column so the UI can sub-tab groom/bride.
--
-- Run once in WebStorm (with the Supabase datasource selected) or
-- paste into Supabase Dashboard → SQL Editor. Idempotent & safe to
-- re-run.

-- ── studios ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.studios (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  sub         TEXT DEFAULT '',
  price       INT  DEFAULT 0,
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.studios DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS studios_price_idx ON public.studios (price);

-- ── dresses ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dresses (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  sub         TEXT DEFAULT '',
  price       INT  DEFAULT 0,
  note        TEXT DEFAULT '',
  target      TEXT NOT NULL DEFAULT 'bride'
                CHECK (target IN ('groom', 'bride')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.dresses DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS dresses_target_idx ON public.dresses (target);

-- ── makeups ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.makeups (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  sub         TEXT DEFAULT '',
  price       INT  DEFAULT 0,
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.makeups DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS makeups_price_idx ON public.makeups (price);

-- ── Realtime publication ───────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.studios;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dresses;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.makeups;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
