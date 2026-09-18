-- Adds inactive_since to profiles: records when a member became inactive.
-- A trigger keeps it in sync automatically.

alter table profiles
  add column if not exists inactive_since date;

-- Auto-set inactive_since when member_status changes to/from 'inactive'.
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
