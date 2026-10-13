import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type DB = Awaited<ReturnType<typeof createClient>>;

export type CommissionRow = Database["public"]["Tables"]["commissions"]["Row"];

export interface CommissionMember {
  id: string;
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
}

export interface CommissionWithMembers extends CommissionRow {
  members: CommissionMember[];
}

/** The current year's commissions, plus the first year that has any. */
export async function listCurrentCommissions(
  supabase: DB,
): Promise<{ year: number; firstYear: number; commissions: CommissionWithMembers[] }> {
  const year = new Date().getFullYear();
  const [commissions, { data: first }] = await Promise.all([
    listCommissions(supabase, year),
    supabase.from("commissions").select("year").order("year", { ascending: true }).limit(1).maybeSingle(),
  ]);
  return { year, firstYear: Math.min(first?.year ?? year, year), commissions };
}

/** A year's commissions with their members: by start month, all-year ones last. */
export async function listCommissions(supabase: DB, year: number): Promise<CommissionWithMembers[]> {
  const { data } = await supabase
    .from("commissions")
    .select("*, commission_members(created_at, member:member_id(id, full_name, nickname, avatar_url))")
    .eq("year", year)
    .order("starts_on", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  type Raw = CommissionRow & {
    commission_members: { created_at: string; member: CommissionMember | null }[];
  };

  return ((data ?? []) as unknown as Raw[]).map(({ commission_members, ...c }) => ({
    ...c,
    members: commission_members
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .flatMap((cm) => (cm.member ? [cm.member] : [])),
  }));
}
