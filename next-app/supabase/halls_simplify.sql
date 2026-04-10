-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Halls schema simplification (2026-04-10)
-- ════════════════════════════════════════════════════════════════
-- The registration modal was rewritten to capture only eight fields:
--   name, sub, price, guests, parking, transport[], note
--
-- This migration is ADDITIVE — it only creates the two new columns
-- (`guests`, `transport`). Old columns (price_label, price_text,
-- price_level, ktx, ktx_text, ktx_warn, is_best, best_label, image,
-- image_alt, image_fallback, badges, info_grid, extra_info_grid,
-- calc, note_type) are left in place so existing data is not lost.
-- They are simply ignored by the frontend now.
--
-- Run once in Supabase Dashboard → SQL Editor → New Query → Run.
-- Safe to re-run — IF NOT EXISTS guards make it idempotent.

ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS guests    INT     DEFAULT 0;

ALTER TABLE public.halls
  ADD COLUMN IF NOT EXISTS transport TEXT[]  DEFAULT ARRAY[]::TEXT[];

-- ─── Optional cleanup (commented out) ──────────────────────────
-- Uncomment + run these if you want to physically drop the old
-- columns. Irreversible — you'll lose the data in those columns.
--
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS price_label;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS price_text;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS price_level;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS ktx;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS ktx_text;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS ktx_warn;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS is_best;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS best_label;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS image;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS image_alt;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS image_fallback;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS badges;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS info_grid;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS extra_info_grid;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS calc;
-- ALTER TABLE public.halls DROP COLUMN IF EXISTS note_type;
