-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Enable Realtime on shared tables
-- ════════════════════════════════════════════════════════════════
-- Supabase uses Postgres logical replication for real-time updates.
-- To make a table subscribable from the browser, add it to the
-- `supabase_realtime` publication.
--
-- Run this once in Supabase SQL Editor. Safe to re-run — ADD TABLE
-- will error if the table is already in the publication, so we wrap
-- in DO blocks that ignore that specific error.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.halls;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Verify: these should both return at least one row
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
