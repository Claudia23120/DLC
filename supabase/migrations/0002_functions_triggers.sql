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
    new.role_title     := old.role_title;
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
