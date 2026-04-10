-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — events table (2026-04-10)
-- ════════════════════════════════════════════════════════════════
-- Replaces the hardcoded SAMPLE_EVENTS in OverviewSection.tsx with
-- a real table. Both users edit the same list and see each other's
-- changes in real time (via the supabase_realtime publication below).
--
-- Run once in WebStorm (with the Supabase datasource selected) or
-- paste into Supabase Dashboard → SQL Editor. Idempotent & safe to
-- re-run.

CREATE TABLE IF NOT EXISTS public.events (
  id          BIGSERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'other'
                CHECK (type IN ('hall', 'studio', 'dress', 'makeup', 'other')),
  time        TEXT,    -- "HH:MM" (nullable)
  location    TEXT,
  memo        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Access is gated by the Next.js proxy layer, same as halls / budgets.
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Upcoming-events queries hit `date` heavily.
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events (date);

-- Publish to realtime so both wed1 and wed2 get live updates.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
