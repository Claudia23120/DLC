import "server-only";
import type { createClient } from "@/lib/supabase/server";

type DB = Awaited<ReturnType<typeof createClient>>;

export interface PollOptionResult {
  id: string;
  label: string;
  count: number;
  pct: number; // 0-100
  mine: boolean;
}

export interface PollResults {
  options: PollOptionResult[];
  total: number;
  myOptionId: string | null;
}

/** Poll options with live vote tallies and the current member's choice. */
export async function getPollResults(
  supabase: DB,
  eventId: string,
  userId: string,
): Promise<PollResults> {
  const [{ data: options }, { data: votes }] = await Promise.all([
    supabase.from("poll_options").select("id, label, position").eq("event_id", eventId).order("position", { ascending: true }),
    supabase.from("poll_votes").select("option_id, member_id").eq("event_id", eventId),
  ]);

  const tally = new Map<string, number>();
  let myOptionId: string | null = null;
  for (const v of votes ?? []) {
    tally.set(v.option_id, (tally.get(v.option_id) ?? 0) + 1);
    if (v.member_id === userId) myOptionId = v.option_id;
  }
  const total = votes?.length ?? 0;

  const results: PollOptionResult[] = (options ?? []).map((o) => {
    const count = tally.get(o.id) ?? 0;
    return {
      id: o.id,
      label: o.label,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      mine: myOptionId === o.id,
    };
  });

  return { options: results, total, myOptionId };
}
