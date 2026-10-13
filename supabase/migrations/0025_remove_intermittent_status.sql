-- 'intermittent' member status is no longer used: existing rows become 'active'.
-- (The enum value itself stays; Postgres can't drop enum values in place.)
update profiles set member_status = 'active' where member_status = 'intermittent';
