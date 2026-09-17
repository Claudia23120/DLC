-- ════════════════════════════════════════════════════════════════════════
-- Custom event options + member responses
-- Also adds allow_multiple_options to events.
-- Admins can attach arbitrary boolean/text questions to a bolo.
-- Members answer them as part of their sign-up.
-- ════════════════════════════════════════════════════════════════════════

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

drop policy if exists event_options_select_all on event_options;
create policy event_options_select_all on event_options
  for select to authenticated using (true);

drop policy if exists event_options_write_admin on event_options;
create policy event_options_write_admin on event_options
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Member responses to custom options ───────────────────────────────────
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

drop policy if exists attendance_responses_select_all on bolo_attendance_responses;
create policy attendance_responses_select_all on bolo_attendance_responses
  for select to authenticated using (true);

drop policy if exists attendance_responses_insert_self on bolo_attendance_responses;
create policy attendance_responses_insert_self on bolo_attendance_responses
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists attendance_responses_update_self on bolo_attendance_responses;
create policy attendance_responses_update_self on bolo_attendance_responses
  for update to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists attendance_responses_delete_self_or_admin on bolo_attendance_responses;
create policy attendance_responses_delete_self_or_admin on bolo_attendance_responses
  for delete to authenticated
  using (member_id = auth.uid() or public.is_admin());
