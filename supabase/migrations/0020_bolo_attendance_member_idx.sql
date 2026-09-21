-- The bolos/junta list queries the current member's own responses across all
-- events (filter by member_id alone). The PK (event_id, member_id) and the
-- event_id index can't serve that filter, so it did a full table scan on every
-- list load. Index member_id to make it a direct lookup.
create index if not exists bolo_attendance_member_idx on bolo_attendance (member_id);
