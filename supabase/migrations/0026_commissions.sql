-- ════════════════════════════════════════════════════════════════════════
-- Comissions: groups of members that organise an event (Carnestoltes,
-- Retoca'Mmmm…) or a year-long task. Each commission belongs to one year;
-- at the start of a new year the previous year's commissions are copied
-- with no members (ensure_commissions_for_year).
-- ════════════════════════════════════════════════════════════════════════

create table if not exists commissions (
  id           uuid primary key default gen_random_uuid(),
  year         smallint not null,
  name         text not null,
  -- 'propia' = only Diables; 'entitats' = shared with other entities of the barri.
  kind         text not null default 'propia' check (kind in ('propia', 'entitats')),
  description  text,
  requirements text,
  -- First day of the start / end month. Both null = all year.
  starts_on    date,
  ends_on      date,
  max_members  smallint check (max_members is null or max_members > 0),
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  check ((starts_on is null) = (ends_on is null)),
  check (ends_on is null or ends_on >= starts_on)
);

create index if not exists commissions_year_idx on commissions (year);

create table if not exists commission_members (
  commission_id uuid not null references commissions(id) on delete cascade,
  member_id     uuid not null references profiles(id) on delete cascade,
  added_by      uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (commission_id, member_id)
);

create index if not exists commission_members_member_idx on commission_members (member_id);

-- Years whose commissions were already seeded from the previous year, so a
-- commission the junta deletes is not copied back on the next page load.
create table if not exists commission_years (
  year smallint primary key
);

alter table commissions enable row level security;
alter table commission_members enable row level security;
alter table commission_years enable row level security;

create policy "commissions_select" on commissions
  for select to authenticated using (true);
create policy "commissions_insert" on commissions
  for insert to authenticated with check (public.is_admin());
create policy "commissions_update" on commissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "commissions_delete" on commissions
  for delete to authenticated using (public.is_admin());

-- Members join / leave themselves; the junta can add or remove anyone.
create policy "commission_members_select" on commission_members
  for select to authenticated using (true);
create policy "commission_members_insert" on commission_members
  for insert to authenticated with check (member_id = auth.uid() or public.is_admin());
create policy "commission_members_delete" on commission_members
  for delete to authenticated using (member_id = auth.uid() or public.is_admin());

create policy "commission_years_select" on commission_years
  for select to authenticated using (true);

-- Members can't join a full commission or one from a past year (the junta can).
-- SECURITY DEFINER so it can lock the commission row to serialize sign-ups.
create or replace function public.guard_commission_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max  smallint;
  v_year smallint;
begin
  if public.is_admin() then
    return new;
  end if;

  select max_members, year into v_max, v_year
    from commissions where id = new.commission_id
     for update;

  if v_year < extract(year from now())::smallint then
    raise exception 'Aquesta comissió ja ha acabat';
  end if;

  if v_max is not null
     and (select count(*) from commission_members where commission_id = new.commission_id) >= v_max then
    raise exception 'La comissió ja és plena';
  end if;

  return new;
end;
$$;

create trigger commission_members_guard_join
  before insert on commission_members
  for each row execute function public.guard_commission_join();

-- Copy the latest earlier year's commissions into p_year (dates shifted, no
-- members), once per year. Safe to call on every page load.
create or replace function public.ensure_commissions_for_year(p_year smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_src smallint;
begin
  if auth.uid() is null then
    raise exception 'No autenticat';
  end if;
  if p_year > extract(year from now())::smallint then
    return;
  end if;

  insert into commission_years (year) values (p_year) on conflict do nothing;
  if not found then
    return; -- already seeded (or being seeded by a concurrent call)
  end if;

  select max(year) into v_src from commissions where year < p_year;
  if v_src is null then
    return;
  end if;

  insert into commissions (year, name, kind, description, requirements, starts_on, ends_on, max_members, created_by)
  select p_year, name, kind, description, requirements,
         (starts_on + make_interval(years => p_year - v_src))::date,
         (ends_on + make_interval(years => p_year - v_src))::date,
         max_members, created_by
    from commissions
   where year = v_src;
end;
$$;

revoke all on function public.ensure_commissions_for_year(smallint) from public;
grant execute on function public.ensure_commissions_for_year(smallint) to authenticated;
