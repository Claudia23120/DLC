-- ════════════════════════════════════════════════════════════════════════
-- Songs (repertori) table
-- ════════════════════════════════════════════════════════════════════════
--
-- NOTE: Also create a PUBLIC Storage bucket named "songs" in the Supabase
-- dashboard (Storage → New bucket → name: "songs" → Public: on).

create table if not exists songs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text unique not null,
  kind       text,
  gp_url     text,
  tempo      integer,
  notes      text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table songs enable row level security;

create policy "songs_select" on songs
  for select to authenticated using (true);

create policy "songs_insert" on songs
  for insert to authenticated with check (is_admin());

create policy "songs_update" on songs
  for update to authenticated using (is_admin());

create policy "songs_delete" on songs
  for delete to authenticated using (is_admin());
