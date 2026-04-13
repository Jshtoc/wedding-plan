-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Complexes: add pyeong_price column (2026-04-14)
-- ════════════════════════════════════════════════════════════════
-- Depends on: complexes.sql
-- Adds 평단가 (price per 평, 만원) column to the complexes table.
--
-- Idempotent & safe to re-run.

ALTER TABLE public.complexes
  ADD COLUMN IF NOT EXISTS pyeong_price INT DEFAULT 0;

NOTIFY pgrst, 'reload schema';
