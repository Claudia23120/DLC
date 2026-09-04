-- ════════════════════════════════════════════════════════════════════════
-- Aggregated per-event counts for the agenda cards:
--   • signup_count    — bolo sign-ups excluding "no vinc"
--   • confirmed_count — meeting attendees who said "hi seré"
--   • vote_count      — total poll votes
-- security_invoker=true so the view honours the querying member's RLS.
-- ════════════════════════════════════════════════════════════════════════

create or replace view event_counts
with (security_invoker = true)
as
select
  e.id as event_id,
  (select count(*) from bolo_attendance b
     where b.event_id = e.id and b.response <> 'no') as signup_count,
  (select count(*) from meeting_attendance m
     where m.event_id = e.id and m.response = 'yes') as confirmed_count,
  (select count(*) from poll_votes v
     where v.event_id = e.id) as vote_count
from events e;
