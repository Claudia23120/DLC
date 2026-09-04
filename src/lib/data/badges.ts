import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type DB = Awaited<ReturnType<typeof createClient>>;

export type BadgeDefinitionRow = Database["public"]["Tables"]["badge_definitions"]["Row"];
export type MemberBadgeRow = Database["public"]["Tables"]["member_badges"]["Row"];

export interface BadgeWithCount extends BadgeDefinitionRow {
  member_count: number;
}

export interface MemberBadgeWithDef extends MemberBadgeRow {
  badge: BadgeDefinitionRow;
}

/** All badge definitions with how many members earned each one. */
export async function listBadgesWithCounts(supabase: DB): Promise<BadgeWithCount[]> {
  const [{ data: defs }, { data: grants }] = await Promise.all([
    supabase.from("badge_definitions").select("*").order("created_at", { ascending: true }),
    supabase.from("member_badges").select("badge_id"),
  ]);

  const counts: Record<string, number> = {};
  for (const g of grants ?? []) {
    counts[g.badge_id] = (counts[g.badge_id] ?? 0) + 1;
  }

  return (defs ?? []).map((d) => ({ ...d, member_count: counts[d.id] ?? 0 }));
}

/** All badges earned by a specific member, with definition details. */
export async function getMemberBadges(supabase: DB, memberId: string): Promise<MemberBadgeWithDef[]> {
  const { data } = await supabase
    .from("member_badges")
    .select("*, badge:badge_id(*)")
    .eq("member_id", memberId)
    .order("earned_at", { ascending: true });
  return (data ?? []) as unknown as MemberBadgeWithDef[];
}
