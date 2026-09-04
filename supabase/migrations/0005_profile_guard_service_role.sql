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
