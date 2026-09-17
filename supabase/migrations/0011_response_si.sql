-- ════════════════════════════════════════════════════════════════════════
-- Add 'si' (generic yes) to the bolo_attendance response check constraint.
-- Needed for bolos with no specific roles (anyone can come).
-- Also update refresh_member_counts to count 'si' toward bolo_count.
-- ════════════════════════════════════════════════════════════════════════

-- Drop all check constraints on bolo_attendance.response and recreate.
do $$
declare
  r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'bolo_attendance'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%response%'
  loop
    execute 'alter table bolo_attendance drop constraint ' || quote_ident(r.conname);
  end loop;
end $$;

alter table bolo_attendance
  add constraint bolo_attendance_response_check
  check (response in ('diable', 'tabaler', 'supporter', 'no', 'si'));

-- Update counter function so 'si' counts toward bolo_count.
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
    count(*) filter (where ba.response in ('diable', 'tabaler', 'supporter', 'si')),
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
