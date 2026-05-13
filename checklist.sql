-- Wedding checklist sync table
-- 그룹당 1행 (upsert)

create table if not exists wedding_checklist (
  group_id    text primary key,
  checked     jsonb not null default '[]',
  details     jsonb not null default '{}',
  total_budget text  not null default '',
  updated_at  timestamptz not null default now()
);

-- RLS
alter table wedding_checklist enable row level security;

create policy "group members can read"
  on wedding_checklist for select
  using (true);

create policy "group members can upsert"
  on wedding_checklist for all
  using (true)
  with check (true);
