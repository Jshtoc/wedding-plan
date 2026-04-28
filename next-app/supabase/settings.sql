-- Migration 16: settings table (per-group app settings)
-- Dependency: multi_tenant.sql (group_id pattern)

CREATE TABLE IF NOT EXISTS settings (
  id          bigint generated always as identity primary key,
  group_id    text        not null unique,
  menu_hidden text[]      not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
