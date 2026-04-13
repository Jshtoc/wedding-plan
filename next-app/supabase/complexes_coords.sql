-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Add coordinates to complexes (2026-04-13)
-- ════════════════════════════════════════════════════════════════
-- Stores lat/lng from Naver Geocoding so the route planner can
-- skip on-the-fly geocoding and render markers immediately.
--
-- Run once in WebStorm. Safe to re-run (IF NOT EXISTS).

ALTER TABLE public.complexes ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.complexes ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.complexes ADD COLUMN IF NOT EXISTS address TEXT;

NOTIFY pgrst, 'reload schema';
