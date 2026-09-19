import "server-only";
import type { Database } from "@/types/database";
import type { createClient } from "@/lib/supabase/server";

type DB = Awaited<ReturnType<typeof createClient>>;

export type SongRow = Database["public"]["Tables"]["songs"]["Row"];

export type SongListItem = Pick<SongRow, "id" | "title" | "slug" | "kind" | "gp_url">;

/** Lightweight query for the public music list (no score data). */
export async function listSongsLight(supabase: DB): Promise<SongListItem[]> {
  const { data } = await supabase
    .from("songs")
    .select("id, title, slug, kind, gp_url")
    .order("title");
  return (data ?? []) as SongListItem[];
}

/** Full query used by the admin panel (needs all fields for editing). */
export async function listSongs(supabase: DB): Promise<SongRow[]> {
  const { data } = await supabase.from("songs").select("*").order("title");
  return data ?? [];
}

export async function getSongBySlug(supabase: DB, slug: string): Promise<SongRow | null> {
  const { data } = await supabase.from("songs").select("*").eq("slug", slug).maybeSingle();
  return data;
}
