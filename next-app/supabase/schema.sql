-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Supabase schema
-- ════════════════════════════════════════════════════════════════
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Creates the `halls` table that src/lib/db.ts expects.
-- Column names are snake_case (db.ts converts to camelCase for the frontend).
--
-- RLS note:
--   RLS is intentionally DISABLED for this personal project. Access is
--   enforced by the Next.js middleware (src/proxy.ts) which verifies a
--   signed session cookie before letting any request reach the API.
--   Direct Supabase API access with the anon key would bypass the proxy,
--   so if you later expose this beyond personal use, enable RLS and move
--   queries to a server-side client with the service role key.

CREATE TABLE IF NOT EXISTS public.halls (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  sub              TEXT DEFAULT '',
  price            INT  DEFAULT 0,
  price_label      TEXT DEFAULT '',
  price_text       TEXT DEFAULT '',
  price_level      TEXT DEFAULT 'ok' CHECK (price_level IN ('ok', 'warn', 'over')),
  ktx              INT  DEFAULT 3,
  ktx_text         TEXT DEFAULT '',
  ktx_warn         BOOLEAN DEFAULT false,
  parking          INT  DEFAULT 0,
  is_best          BOOLEAN DEFAULT false,
  best_label       TEXT,
  image            TEXT DEFAULT '',
  image_alt        TEXT DEFAULT '',
  image_fallback   TEXT DEFAULT '🏛️',
  badges           JSONB DEFAULT '[]'::jsonb,
  info_grid        JSONB DEFAULT '[]'::jsonb,
  extra_info_grid  JSONB,
  calc             JSONB DEFAULT '{"title": "", "rows": []}'::jsonb,
  note             TEXT DEFAULT '',
  note_type        TEXT CHECK (note_type IS NULL OR note_type IN ('warn', 'danger')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Personal project: access control is enforced at the Next.js layer.
ALTER TABLE public.halls DISABLE ROW LEVEL SECURITY;

-- Helpful index for the default ORDER BY price.
CREATE INDEX IF NOT EXISTS halls_price_idx ON public.halls (price);
