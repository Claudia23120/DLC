-- Add acta_url to events for meeting minutes link
alter table events
  add column if not exists acta_url text;
