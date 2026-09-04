-- ════════════════════════════════════════════════════════════════════════
-- Phase 2 schema additions
-- ════════════════════════════════════════════════════════════════════════

-- ── Padrins (godparents) columns on profiles ─────────────────────────────
alter table profiles
  add column if not exists padri_foc_id   uuid references profiles (id) on delete set null,
  add column if not exists padri_tabal_id uuid references profiles (id) on delete set null;

-- ── Badge definitions ─────────────────────────────────────────────────────
create table if not exists badge_definitions (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  description    text,
  icon           text not null default '🏅',
  type           text not null check (type in ('automatic', 'manual', 'repte')),
  criteria       jsonb,
  repte_pattern  text,
  created_at     timestamptz not null default now()
);

-- ── Member badges ─────────────────────────────────────────────────────────
create table if not exists member_badges (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles (id) on delete cascade,
  badge_id    uuid not null references badge_definitions (id) on delete cascade,
  earned_at   timestamptz not null default now(),
  granted_by  uuid references profiles (id) on delete set null,
  notes       text,
  unique (member_id, badge_id)
);

create index if not exists member_badges_member_idx on member_badges (member_id);
create index if not exists member_badges_badge_idx  on member_badges (badge_id);

-- ── RLS for new tables ────────────────────────────────────────────────────
alter table badge_definitions enable row level security;
alter table member_badges     enable row level security;

create policy badge_definitions_select_all
  on badge_definitions for select
  to authenticated
  using (true);

create policy badge_definitions_write_admin
  on badge_definitions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy member_badges_select_all
  on member_badges for select
  to authenticated
  using (true);

create policy member_badges_insert_admin
  on member_badges for insert
  to authenticated
  with check (public.is_admin());

create policy member_badges_delete_admin
  on member_badges for delete
  to authenticated
  using (public.is_admin());

-- ── Seed: automatic badge definitions ────────────────────────────────────
insert into badge_definitions (slug, name, description, icon, type, criteria) values
  ('bolos_10', '10 Bolos', 'Has participat a 10 bolos de la colla', '🔥', 'automatic', '{"kind":"bolos_attended","count":10}'),
  ('bolos_25', '25 Bolos', 'Has participat a 25 bolos de la colla', '⚡', 'automatic', '{"kind":"bolos_attended","count":25}'),
  ('bolos_50', '50 Bolos', 'Has participat a 50 bolos de la colla', '🏆', 'automatic', '{"kind":"bolos_attended","count":50}'),
  ('years_1',  '1 Any',   'Portes 1 any o més a la colla',          '🌱', 'automatic', '{"kind":"years_in_colla","count":1}'),
  ('years_5',  '5 Anys',  'Portes 5 anys o més a la colla',         '🌟', 'automatic', '{"kind":"years_in_colla","count":5}')
on conflict (slug) do nothing;
