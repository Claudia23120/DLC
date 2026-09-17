import "server-only";
import type { Database } from "@/types/database";
import type { createClient } from "@/lib/supabase/server";

type DB = Awaited<ReturnType<typeof createClient>>;

export type SongRow = Database["public"]["Tables"]["songs"]["Row"];

export async function listSongs(supabase: DB): Promise<SongRow[]> {
  const { data } = await supabase.from("songs").select("*").order("title");
  return data ?? [];
}

export async function getSongBySlug(supabase: DB, slug: string): Promise<SongRow | null> {
  const { data } = await supabase.from("songs").select("*").eq("slug", slug).maybeSingle();
  return data;
}
