
-- ═══════════════════════════════════════════════════════════
-- migrations/0001_core_schema.sql
-- ═══════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════════
-- Colla de Diables de Les Corts — core schema (Phase 1)
-- Entities: profiles (members), events (bolo/reunió/votació), poll options &
-- votes, bolo & meeting attendance, comments.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────

-- Board (junta) positions. A member holding a position is an admin.
create type board_position as enum (
  'presidenta',
  'vicepresidenta',
  'secretaria',
  'tresorera',
  'cap_de_foc',
  'cap_de_tabals'
);

-- What a member does at a bolo (separate from the admin/normal permission).
create type member_role as enum ('diable', 'tabaler', 'supporter');

-- Kind of event.
create type event_kind as enum ('bolo', 'event', 'votacio');

-- ── Profiles ────────────────────────────────────────────────────────────
-- One row per auth user. No public sign-up: rows are created by admins.
create table profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text not null,
  nickname           text,                       -- "mote"
  email              text not null unique,
  phone              text,
  nif                text,
  birth_date         date,
  emergency_contact  text,
  medical_notes      text,
  bio                text,

  board_position     board_position,              -- non-null ⇒ admin (junta)
  -- Derived admin flag; cannot be set independently of board_position.
  is_admin           boolean generated always as (board_position is not null) stored,
  member_roles       member_role[] not null default '{diable}',
  joined_year        int,
  sizes              jsonb not null default '{}'::jsonb,  -- casaca / pantalo / tabaler + own_suit flags
  gear_needs         jsonb not null default '{}'::jsonb,  -- guants / ulleres ...
  -- Counters that drive the badge ladders (auto-incremented in Phase 2).
  bolo_count         int not null default 0,
  foc_count          int not null default 0,
  tabal_count        int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on column profiles.is_admin is
  'Derived from board_position; a member cannot self-promote.';

-- ── Events (unified bolo / reunió / votació) ────────────────────────────
create table events (
  id             uuid primary key default gen_random_uuid(),
  kind           event_kind not null,
  title          text not null,
  starts_at      timestamptz,
  location       text,
  organizer      text,
  description    text,

  -- bolo-specific
  place_note     text,
  time_note      text,
  map_url        text,
  ask_cars       boolean not null default true,
  ask_sizes      boolean not null default true,
  allowed_roles  member_role[] not null default '{diable,tabaler,supporter}',

  -- reunió-specific
  agenda         text,
  affects        text,
  acta_url       text,
  -- (schema continued below)

  -- votació-specific
  closes_at      timestamptz,

  created_by     uuid references profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index events_kind_starts_idx on events (kind, starts_at);

-- ── Poll options & votes ────────────────────────────────────────────────
create table poll_options (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events (id) on delete cascade,
  label      text not null,
  position   int not null default 0
);

create index poll_options_event_idx on poll_options (event_id);

create table poll_votes (
  event_id   uuid not null references events (id) on delete cascade,
  option_id  uuid not null references poll_options (id) on delete cascade,
  member_id  uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)   -- one (changeable) vote per member per poll
);

create index poll_votes_event_idx on poll_votes (event_id);
create index poll_votes_option_idx on poll_votes (option_id);

-- ── Bolo attendance (sign-ups) ──────────────────────────────────────────
create table bolo_attendance (
  event_id      uuid not null references events (id) on delete cascade,
  member_id     uuid not null references profiles (id) on delete cascade,
  response      text not null check (response in ('diable', 'tabaler', 'supporter', 'no')),
  brings_car    boolean not null default false,
  car_seats     int,
  size_snapshot jsonb,
  needs         text[] not null default '{}',
  updated_at    timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index bolo_attendance_event_idx on bolo_attendance (event_id);

-- ── Meeting attendance ──────────────────────────────────────────────────
create table meeting_attendance (
  event_id   uuid not null references events (id) on delete cascade,
  member_id  uuid not null references profiles (id) on delete cascade,
  response   text not null check (response in ('yes', 'no')),
  updated_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index meeting_attendance_event_idx on meeting_attendance (event_id);

-- ── Comments (on bolos, meetings and polls) ─────────────────────────────
create table comments (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events (id) on delete cascade,
  member_id  uuid references profiles (id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index comments_event_idx on comments (event_id, created_at);


-- ═══════════════════════════════════════════════════════════
-- migrations/0002_functions_triggers.sql
-- ═══════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════════
-- Functions & triggers.
-- ════════════════════════════════════════════════════════════════════════

-- ── is_admin(): true when the current user holds a board position ────────
-- SECURITY DEFINER so it can read profiles without tripping that table's own
-- RLS (avoids policy recursion). Kept minimal and locked to a safe search_path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select board_position is not null from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ── keep updated_at fresh ────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function public.touch_updated_at();

create trigger bolo_attendance_touch_updated_at
  before update on bolo_attendance
  for each row execute function public.touch_updated_at();

create trigger meeting_attendance_touch_updated_at
  before update on meeting_attendance
  for each row execute function public.touch_updated_at();

-- ── Protect privileged profile columns from non-admins ───────────────────
-- Even though RLS lets a member update their own row, they must not be able to
-- change privileged columns (board_position, role_title, counters). A non-admin
-- attempting to change them has those columns silently reset to their old value.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.board_position := old.board_position;

    new.member_roles   := old.member_roles;
    new.bolo_count     := old.bolo_count;
    new.foc_count      := old.foc_count;
    new.tabal_count    := old.tabal_count;
    new.email          := old.email;  -- email changes go through Supabase Auth
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged
  before update on profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ── Reject poll votes after the poll has closed ──────────────────────────
create or replace function public.guard_poll_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closes_at timestamptz;
begin
  select closes_at into v_closes_at from public.events where id = new.event_id;
  if v_closes_at is not null and now() > v_closes_at then
    raise exception 'La votació ja està tancada';
  end if;
  return new;
end;
$$;

create trigger poll_votes_guard_open
  before insert or update on poll_votes
  for each row execute function public.guard_poll_open();

-- ── New auth user → profile stub ─────────────────────────────────────────
-- Admins create members via the service-role API and pass full_name/roles in
-- user metadata; this mirrors those into a profiles row automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    new.raw_user_meta_data ->> 'nickname'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ═══════════════════════════════════════════════════════════
-- migrations/0003_rls_policies.sql
-- ═══════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════════
-- Row Level Security. Deny-by-default: every table has RLS enabled and only
-- the policies below grant access. The two roles are:
--   • admin  = member with a board position (public.is_admin() = true)
--   • normal = any other authenticated member
-- A normal user can join/leave events, vote, comment and edit their own
-- profile — nothing else — enforced here in the database, not just the UI.
-- ════════════════════════════════════════════════════════════════════════

alter table profiles           enable row level security;
alter table events             enable row level security;
alter table poll_options       enable row level security;
alter table poll_votes         enable row level security;
alter table bolo_attendance    enable row level security;
alter table meeting_attendance enable row level security;
alter table comments           enable row level security;

-- ── Profiles ─────────────────────────────────────────────────────────────
-- Everyone authenticated can read the roster.
create policy profiles_select_all
  on profiles for select
  to authenticated
  using (true);

-- A member can update their own row; privileged columns are protected by the
-- guard_profile_privileged_columns() trigger. Admins can update anyone.
create policy profiles_update_self_or_admin
  on profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Only admins create members (paired with the service-role API for auth).
create policy profiles_insert_admin
  on profiles for insert
  to authenticated
  with check (public.is_admin());

-- Only admins delete members.
create policy profiles_delete_admin
  on profiles for delete
  to authenticated
  using (public.is_admin());

-- ── Events ───────────────────────────────────────────────────────────────
create policy events_select_all
  on events for select
  to authenticated
  using (true);

create policy events_insert_admin
  on events for insert
  to authenticated
  with check (public.is_admin());

create policy events_update_admin
  on events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy events_delete_admin
  on events for delete
  to authenticated
  using (public.is_admin());

-- ── Poll options (managed with their event, admin-only writes) ───────────
create policy poll_options_select_all
  on poll_options for select
  to authenticated
  using (true);

create policy poll_options_write_admin
  on poll_options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Poll votes (a member manages only their own vote) ────────────────────
create policy poll_votes_select_all
  on poll_votes for select
  to authenticated
  using (true);

create policy poll_votes_insert_self
  on poll_votes for insert
  to authenticated
  with check (member_id = auth.uid());

create policy poll_votes_update_self
  on poll_votes for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy poll_votes_delete_self
  on poll_votes for delete
  to authenticated
  using (member_id = auth.uid());

-- ── Bolo attendance (a member manages only their own sign-up) ────────────
create policy bolo_attendance_select_all
  on bolo_attendance for select
  to authenticated
  using (true);

create policy bolo_attendance_insert_self
  on bolo_attendance for insert
  to authenticated
  with check (member_id = auth.uid());

create policy bolo_attendance_update_self
  on bolo_attendance for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy bolo_attendance_delete_self
  on bolo_attendance for delete
  to authenticated
  using (member_id = auth.uid());

-- ── Meeting attendance (a member manages only their own response) ────────
create policy meeting_attendance_select_all
  on meeting_attendance for select
  to authenticated
  using (true);

create policy meeting_attendance_insert_self
  on meeting_attendance for insert
  to authenticated
  with check (member_id = auth.uid());

create policy meeting_attendance_update_self
  on meeting_attendance for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy meeting_attendance_delete_self
  on meeting_attendance for delete
  to authenticated
  using (member_id = auth.uid());

-- ── Comments (author writes/edits/deletes own; admins can moderate) ──────
create policy comments_select_all
  on comments for select
  to authenticated
  using (true);

create policy comments_insert_self
  on comments for insert
  to authenticated
  with check (member_id = auth.uid());

create policy comments_update_self
  on comments for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy comments_delete_self_or_admin
  on comments for delete
  to authenticated
  using (member_id = auth.uid() or public.is_admin());


-- ═══════════════════════════════════════════════════════════
-- migrations/0004_event_counts_view.sql
-- ═══════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════════
-- Aggregated per-event counts for the agenda cards:
--   • signup_count    — bolo sign-ups excluding "no vinc"
--   • confirmed_count — meeting attendees who said "hi seré"
--   • vote_count      — total poll votes
-- security_invoker=true so the view honours the querying member's RLS.
-- ════════════════════════════════════════════════════════════════════════

create or replace view event_counts
with (security_invoker = true)
as
select
  e.id as event_id,
  (select count(*) from bolo_attendance b
     where b.event_id = e.id and b.response <> 'no') as signup_count,
  (select count(*) from meeting_attendance m
     where m.event_id = e.id and m.response = 'yes') as confirmed_count,
  (select count(*) from poll_votes v
     where v.event_id = e.id) as vote_count
from events e;


-- ═══════════════════════════════════════════════════════════
-- migrations/0005_profile_guard_service_role.sql
-- ═══════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════════
-- Let trusted server code manage privileged profile columns.
--
-- The original guard reset privileged columns whenever the caller was not an
-- admin. But the service-role client (used to create members and set their
-- roles / board position) has no auth.uid(), so it was wrongly treated as a
-- normal member. Skip the guard when there is no auth.uid() (service role /
-- server context); normal members always have one and stay restricted.
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role; those writes are trusted.
  if auth.uid() is not null and not public.is_admin() then
    new.board_position := old.board_position;

    new.member_roles   := old.member_roles;
    new.bolo_count     := old.bolo_count;
    new.foc_count      := old.foc_count;
    new.tabal_count    := old.tabal_count;
    new.email          := old.email;  -- email changes go through Supabase Auth
  end if;
  return new;
end;
$$;


-- ═══════════════════════════════════════════════════════════
-- migrations/0006_phase2_schema.sql
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- migrations/0007_phase2_functions.sql
-- ═══════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════════
-- Phase 2 functions & triggers
-- ════════════════════════════════════════════════════════════════════════

-- ── Guard trigger: add joined_year to protected columns ──────────────────
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.board_position := old.board_position;

    new.member_roles   := old.member_roles;
    new.bolo_count     := old.bolo_count;
    new.foc_count      := old.foc_count;
    new.tabal_count    := old.tabal_count;
    new.email          := old.email;
    new.joined_year    := old.joined_year;
  end if;
  return new;
end;
$$;

-- ── Recalculate bolo/foc/tabal counters for a member ────────────────────
create or replace function public.refresh_member_counts(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bolo_count  int;
  v_foc_count   int;
  v_tabal_count int;
begin
  select
    count(*) filter (where ba.response in ('diable', 'tabaler', 'supporter')),
    count(*) filter (where ba.response = 'diable'),
    count(*) filter (where ba.response = 'tabaler')
  into v_bolo_count, v_foc_count, v_tabal_count
  from bolo_attendance ba
  where ba.member_id = p_member_id
    and ba.response <> 'no';

  update profiles
  set
    bolo_count  = coalesce(v_bolo_count, 0),
    foc_count   = coalesce(v_foc_count, 0),
    tabal_count = coalesce(v_tabal_count, 0)
  where id = p_member_id;
end;
$$;

revoke all on function public.refresh_member_counts(uuid) from public;
grant execute on function public.refresh_member_counts(uuid) to authenticated;

-- ── Award automatic badges based on counters / joined_year ───────────────
create or replace function public.award_automatic_badges(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bolo_count  int;
  v_joined_year int;
  v_years_in    int;
  r             record;
  v_count       int;
  v_kind        text;
begin
  select bolo_count, joined_year
  into v_bolo_count, v_joined_year
  from profiles
  where id = p_member_id;

  v_years_in := extract(year from now()) - coalesce(v_joined_year, extract(year from now())::int);

  for r in
    select id, criteria
    from badge_definitions
    where type = 'automatic'
      and criteria is not null
  loop
    v_kind  := r.criteria ->> 'kind';
    v_count := (r.criteria ->> 'count')::int;

    if v_kind = 'bolos_attended' and v_bolo_count >= v_count then
      insert into member_badges (member_id, badge_id)
      values (p_member_id, r.id)
      on conflict (member_id, badge_id) do nothing;
    elsif v_kind = 'years_in_colla' and v_joined_year is not null and v_years_in >= v_count then
      insert into member_badges (member_id, badge_id)
      values (p_member_id, r.id)
      on conflict (member_id, badge_id) do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function public.award_automatic_badges(uuid) from public;
grant execute on function public.award_automatic_badges(uuid) to authenticated;

-- ── Award repte badges: member attended ALL bolos matching the pattern ────
create or replace function public.award_repte_badges(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r              record;
  v_total        int;
  v_attended     int;
begin
  for r in
    select id, repte_pattern
    from badge_definitions
    where type = 'repte'
      and repte_pattern is not null
  loop
    select count(*) into v_total
    from events
    where kind = 'bolo'
      and lower(title) like '%' || lower(r.repte_pattern) || '%';

    if v_total = 0 then
      continue;
    end if;

    select count(*) into v_attended
    from bolo_attendance ba
    join events e on e.id = ba.event_id
    where ba.member_id = p_member_id
      and ba.response <> 'no'
      and e.kind = 'bolo'
      and lower(e.title) like '%' || lower(r.repte_pattern) || '%';

    if v_attended >= v_total then
      insert into member_badges (member_id, badge_id)
      values (p_member_id, r.id)
      on conflict (member_id, badge_id) do nothing;
    end if;
  end loop;
end;
$$;

revoke all on function public.award_repte_badges(uuid) from public;
grant execute on function public.award_repte_badges(uuid) to authenticated;

-- ── Trigger: run all badge logic on bolo_attendance changes ─────────────
create or replace function public.bolo_attendance_badge_check_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  v_member_id := coalesce(new.member_id, old.member_id);
  perform public.refresh_member_counts(v_member_id);
  perform public.award_automatic_badges(v_member_id);
  perform public.award_repte_badges(v_member_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists bolo_attendance_badge_check on bolo_attendance;
create trigger bolo_attendance_badge_check
  after insert or update on bolo_attendance
  for each row execute function public.bolo_attendance_badge_check_fn();


-- ═══════════════════════════════════════════════════════════
-- migrations/0008_member_status_cre.sql
-- ═══════════════════════════════════════════════════════════
-- Adds member activity status (active / inactive / intermittent) and two
-- boolean flags (has_cre, has_rgcre). All three are admin-only fields.
-- Inactive members are blocked from accessing the app.

create type member_status as enum ('active', 'inactive', 'intermittent');

alter table profiles
  add column if not exists member_status member_status not null default 'active',
  add column if not exists has_cre        boolean       not null default false,
  add column if not exists has_rgcre      boolean       not null default false;

alter table profiles
  add column if not exists quota_automatic boolean not null default false;

-- Extend the privileged-column guard to cover the new fields.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role; those writes are trusted.
  if auth.uid() is not null and not public.is_admin() then
    new.board_position     := old.board_position;
    new.role_title         := old.role_title;
    new.member_roles       := old.member_roles;
    new.bolo_count         := old.bolo_count;
    new.foc_count          := old.foc_count;
    new.tabal_count        := old.tabal_count;
    new.email              := old.email;
    new.joined_year        := old.joined_year;
    new.member_status      := old.member_status;
    new.has_cre            := old.has_cre;
    new.has_rgcre          := old.has_rgcre;
    new.quota_automatic  := old.quota_automatic;
  end if;
  return new;
end;
$$;

-- ── Per-year quota payment tracking (for non-domiciliated members) ───────
create table if not exists quota_payments (
  member_id  uuid not null references profiles (id) on delete cascade,
  year       int  not null,
  paid       boolean not null default false,
  primary key (member_id, year)
);

create index if not exists quota_payments_member_idx on quota_payments (member_id);

alter table quota_payments enable row level security;

-- Only admins can read or write quota payment records.
create policy quota_payments_admin
  on quota_payments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════
-- migrations/0009_event_cancelled.sql
-- ═══════════════════════════════════════════════════════════
-- Allows admins to mark a bolo/event as cancelled.

alter table events
  add column if not exists cancelled boolean not null default false;


-- ═══════════════════════════════════════════════════════════
-- migrations/0010_joined_date.sql
-- ═══════════════════════════════════════════════════════════
-- Replaces the integer joined_year with a full date (joined_date).
-- joined_year is kept for badge-function compatibility and kept in sync
-- by the application layer whenever joined_date is saved.

alter table profiles
  add column if not exists joined_date date;

-- Migrate existing year data to Jan 1 of that year.
update profiles
  set joined_date = make_date(joined_year, 1, 1)
  where joined_year is not null and joined_date is null;

-- Protect the new column from non-admin writes.
create or replace function public.guard_profile_privileged_columns()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.board_position    := old.board_position;
    new.role_title        := old.role_title;
    new.member_roles      := old.member_roles;
    new.bolo_count        := old.bolo_count;
    new.foc_count         := old.foc_count;
    new.tabal_count       := old.tabal_count;
    new.email             := old.email;
    new.joined_year       := old.joined_year;
    new.joined_date       := old.joined_date;
    new.member_status     := old.member_status;
    new.has_cre           := old.has_cre;
    new.has_rgcre         := old.has_rgcre;
    new.quota_automatic   := old.quota_automatic;
  end if;
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- migrations/0009_songs.sql
-- ════════════════════════════════════════════════════════════════════════
create table if not exists songs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text unique not null,
  kind       text,
  gp_url     text,
  tempo      integer,
  notes      text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table songs enable row level security;

create policy "songs_select" on songs for select to authenticated using (true);
create policy "songs_insert" on songs for insert to authenticated with check (is_admin());
create policy "songs_update" on songs for update to authenticated using (is_admin());
create policy "songs_delete" on songs for delete to authenticated using (is_admin());

-- ═══════════════════════════════════════════════════════════
-- migrations/0010_event_options.sql
-- ═══════════════════════════════════════════════════════════
alter table events
  add column if not exists allow_multiple_options boolean not null default false;

create table if not exists event_options (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  label      text not null,
  kind       text not null default 'boolean' check (kind in ('boolean', 'text')),
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_options_event_idx on event_options (event_id, position);

alter table event_options enable row level security;

create policy event_options_select_all on event_options
  for select to authenticated using (true);

create policy event_options_write_admin on event_options
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists bolo_attendance_responses (
  event_id   uuid not null,
  member_id  uuid not null,
  option_id  uuid not null references event_options(id) on delete cascade,
  value      text,
  foreign key (event_id, member_id)
    references bolo_attendance(event_id, member_id) on delete cascade,
  primary key (event_id, member_id, option_id)
);

create index if not exists attendance_responses_event_member_idx
  on bolo_attendance_responses (event_id, member_id);

alter table bolo_attendance_responses enable row level security;

create policy attendance_responses_select_all on bolo_attendance_responses
  for select to authenticated using (true);

create policy attendance_responses_insert_self on bolo_attendance_responses
  for insert to authenticated with check (member_id = auth.uid());

create policy attendance_responses_update_self on bolo_attendance_responses
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy attendance_responses_delete_self_or_admin on bolo_attendance_responses
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- migrations/0018_inactive_since.sql
-- ═══════════════════════════════════════════════════════════
-- Adds inactive_since to profiles: records when a member became inactive.

alter table profiles
  add column if not exists inactive_since date;

create or replace function profiles_set_inactive_since()
returns trigger language plpgsql as $$
begin
  if new.member_status = 'inactive' and old.member_status <> 'inactive' then
    new.inactive_since := current_date;
  elsif new.member_status <> 'inactive' and old.member_status = 'inactive' then
    new.inactive_since := null;
  end if;
  return new;
end;
$$;

create trigger profiles_set_inactive_since
  before update on profiles
  for each row execute function profiles_set_inactive_since();
