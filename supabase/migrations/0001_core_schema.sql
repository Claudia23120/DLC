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
create type event_kind as enum ('bolo', 'reunio', 'votacio');

-- ── Profiles ────────────────────────────────────────────────────────────
-- One row per auth user. No public sign-up: rows are created by admins.
create table profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text not null,
  nickname           text,                       -- "mote"
  email              text not null unique,
  phone              text,
  emergency_contact  text,
  medical_notes      text,
  bio                text,
  role_title         text,                        -- free-text role, e.g. "Portador de la Rabosa"
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
