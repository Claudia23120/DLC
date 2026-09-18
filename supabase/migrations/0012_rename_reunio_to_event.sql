-- Rename the enum value 'reunio' → 'event' in the event_kind type.
-- PostgreSQL 10+ supports ALTER TYPE ... RENAME VALUE.
ALTER TYPE event_kind RENAME VALUE 'reunio' TO 'event';
