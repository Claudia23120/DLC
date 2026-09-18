create or replace function public.joined_date_badge_check_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.joined_date is distinct from old.joined_date then
    perform public.award_automatic_badges(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists joined_date_badge_check on profiles;
create trigger joined_date_badge_check
  after update on profiles
  for each row execute function public.joined_date_badge_check_fn();
