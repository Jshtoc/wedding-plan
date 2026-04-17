-- Migration #16: 임장 메모 (2026-04-17)
-- Depends on: multi_tenant.sql, complexes.sql

CREATE TABLE IF NOT EXISTS public.visit_notes (
  id          BIGSERIAL PRIMARY KEY,
  group_id    TEXT NOT NULL,
  complex_id  BIGINT,                -- optional link to complexes.id
  title       TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',   -- 자유 메모
  pros        TEXT DEFAULT '',           -- 장점
  cons        TEXT DEFAULT '',           -- 단점
  rating      SMALLINT DEFAULT 0,        -- 0-5 (0=미평가)
  photos      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- base64 encoded images
  visited_at  DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.visit_notes DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS visit_notes_group_id_idx ON public.visit_notes(group_id);
CREATE INDEX IF NOT EXISTS visit_notes_group_visited_idx
  ON public.visit_notes(group_id, visited_at DESC NULLS LAST, created_at DESC);
NOTIFY pgrst, 'reload schema';
