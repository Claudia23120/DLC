-- Adds the 'active_without_quota' member status: full app access like an
-- active member, but not billed for the yearly quota.
alter type member_status add value if not exists 'active_without_quota';
