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
