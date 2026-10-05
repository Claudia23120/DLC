-- ════════════════════════════════════════════════════════════════════════
-- Hide NIF + emergency contact from other members (RGPD)
--
-- `profiles` is readable by every authenticated member (profiles_select_all),
-- so these two columns were exposed through the REST API. They stay in
-- `profiles`, but authenticated clients can no longer SELECT them directly:
--   • reading goes through get_member_private(), which only answers for the
--     member themselves or a board member (admin);
--   • writing is unchanged (a member updates their own row, RLS still applies).
--
-- NOTE: from now on `select *` on profiles fails for authenticated clients.
-- When you add a column to `profiles` that members should read, also run:
--     grant select (new_column) on public.profiles to authenticated;
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'profiles'
     and column_name not in ('nif', 'emergency_contact');

  revoke select on public.profiles from authenticated;
  execute format('grant select (%s) on public.profiles to authenticated', cols);
end;
$$;

create or replace function public.get_member_private(p_member_id uuid)
returns table (nif text, emergency_contact text)
language sql
stable
security definer
set search_path = public
as $$
  select p.nif, p.emergency_contact
    from profiles p
   where p.id = p_member_id
     and (p.id = auth.uid() or public.is_admin());
$$;

revoke all on function public.get_member_private(uuid) from public;
grant execute on function public.get_member_private(uuid) to authenticated;
