-- ════════════════════════════════════════════════════════════════════════
-- Atomic RPCs for operations that used delete-then-insert from the app.
--
-- Both run as the caller (SECURITY INVOKER), so RLS still applies, and each
-- call is a single transaction: a failing insert (e.g. poll closed) rolls the
-- delete back instead of losing the member's previous answer.
-- ════════════════════════════════════════════════════════════════════════

-- Cast (or toggle) the caller's vote. The single/multiple rule comes from the
-- event itself, never from the client.
create or replace function public.cast_vote(p_event_id uuid, p_option_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_multiple boolean;
  v_closes   timestamptz;
begin
  if v_uid is null then
    raise exception 'No autenticat';
  end if;

  select allow_multiple_votes, closes_at
    into v_multiple, v_closes
    from events
   where id = p_event_id and kind = 'votacio';
  if not found then
    raise exception 'Votació no trobada';
  end if;

  if v_closes is not null and now() > v_closes then
    raise exception 'La votació ja està tancada';
  end if;

  if not exists (
    select 1 from poll_options where id = p_option_id and event_id = p_event_id
  ) then
    raise exception 'Opció no vàlida';
  end if;

  if v_multiple then
    -- Toggle: a second click on the same option removes the vote.
    delete from poll_votes
     where event_id = p_event_id and member_id = v_uid and option_id = p_option_id;
    if found then
      return;
    end if;
  else
    delete from poll_votes where event_id = p_event_id and member_id = v_uid;
  end if;

  insert into poll_votes (event_id, option_id, member_id)
  values (p_event_id, p_option_id, v_uid);
end;
$$;

revoke all on function public.cast_vote(uuid, uuid) from public;
grant execute on function public.cast_vote(uuid, uuid) to authenticated;

-- Replace the caller's selected options for a bolo in one step.
create or replace function public.set_option_selections(p_event_id uuid, p_option_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_multiple boolean;
begin
  if v_uid is null then
    raise exception 'No autenticat';
  end if;

  select allow_multiple_options into v_multiple
    from events
   where id = p_event_id and kind = 'bolo';
  if not found then
    raise exception 'Bolo no trobat';
  end if;

  if not v_multiple and coalesce(array_length(p_option_ids, 1), 0) > 1 then
    raise exception 'Aquest bolo només admet una opció';
  end if;

  delete from bolo_attendance_responses
   where event_id = p_event_id and member_id = v_uid;

  insert into bolo_attendance_responses (event_id, member_id, option_id, value)
  select p_event_id, v_uid, o.id, 'true'
    from event_options o
   where o.event_id = p_event_id
     and o.id = any (coalesce(p_option_ids, '{}'));
end;
$$;

revoke all on function public.set_option_selections(uuid, uuid[]) from public;
grant execute on function public.set_option_selections(uuid, uuid[]) to authenticated;
