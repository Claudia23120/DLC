-- ════════════════════════════════════════════════════════════════════════
-- Commissions are no longer copied automatically at the start of a year: the
-- junta duplicates them by hand (duplicate_commissions). Drops the automatic
-- seeding and the commission_years bookkeeping table it needed.
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.duplicate_commissions(p_from smallint, p_to smallint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Només la junta pot duplicar comissions';
  end if;
  if p_to <= p_from then
    raise exception 'L''any de destí ha de ser posterior';
  end if;

  -- Serialize double clicks on the same target year.
  perform pg_advisory_xact_lock(hashtext('duplicate_commissions'), p_to);

  if exists (select 1 from commissions where year = p_to) then
    raise exception 'Ja hi ha comissions per al %', p_to;
  end if;

  insert into commissions (year, name, kind, description, requirements, starts_on, ends_on, max_members, created_by)
  select p_to, name, kind, description, requirements,
         (starts_on + make_interval(years => p_to - p_from))::date,
         (ends_on + make_interval(years => p_to - p_from))::date,
         max_members, auth.uid()
    from commissions
   where year = p_from;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

drop function if exists public.ensure_commissions_for_year(smallint);
drop table if exists commission_years;
