create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.board_position := old.board_position;
    new.bolo_count     := old.bolo_count;
    new.foc_count      := old.foc_count;
    new.tabal_count    := old.tabal_count;
    new.email          := old.email;
  end if;
  return new;
end;
$$;
