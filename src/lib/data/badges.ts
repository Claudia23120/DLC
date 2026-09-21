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

const TYPE_ORDER: Record<string, number> = { automatic: 0, repte: 1, manual: 2 };
const KIND_ORDER: Record<string, number> = { bolos_attended: 0, years_in_colla: 1 };

function badgeSortKey(d: BadgeDefinitionRow): [number, number, number, string] {
  const typeRank = TYPE_ORDER[d.type] ?? 99;
  const criteria = d.criteria as Record<string, unknown> | null;
  const kindRank = criteria?.kind ? (KIND_ORDER[criteria.kind as string] ?? 99) : 99;
  const count = typeof criteria?.count === "number" ? criteria.count : 0;
  return [typeRank, kindRank, count, d.name];
}

/** All badge definitions with how many members earned each one. */
export async function listBadgesWithCounts(supabase: DB): Promise<BadgeWithCount[]> {
  const [{ data: defs }, { data: grants }] = await Promise.all([
    supabase.from("badge_definitions").select("*"),
    supabase.from("member_badges").select("badge_id"),
  ]);

  const counts: Record<string, number> = {};
  for (const g of grants ?? []) {
    counts[g.badge_id] = (counts[g.badge_id] ?? 0) + 1;
  }

  return (defs ?? [])
    .map((d) => ({ ...d, member_count: counts[d.id] ?? 0 }))
    .sort((a, b) => {
      const ka = badgeSortKey(a);
      const kb = badgeSortKey(b);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return 1;
      }
      return 0;
    });
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
