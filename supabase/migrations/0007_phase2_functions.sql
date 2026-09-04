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
    new.role_title     := old.role_title;
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
