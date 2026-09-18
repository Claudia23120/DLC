import "server-only";
import type { createClient } from "@/lib/supabase/server";

type DB = Awaited<ReturnType<typeof createClient>>;

export interface PollOptionResult {
  id: string;
  label: string;
  count: number;
  pct: number; // 0-100 (relative to unique voters)
  mine: boolean;
}

export interface PollResults {
  options: PollOptionResult[];
  total: number; // unique members who have voted
  myVotedIds: string[];
}

/** Poll options with live vote tallies and the current member's selections. */
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
  const myVotedIds: string[] = [];
  const uniqueVoters = new Set<string>();

  for (const v of votes ?? []) {
    tally.set(v.option_id, (tally.get(v.option_id) ?? 0) + 1);
    uniqueVoters.add(v.member_id);
    if (v.member_id === userId) myVotedIds.push(v.option_id);
  }

  const total = uniqueVoters.size;

  const results: PollOptionResult[] = (options ?? []).map((o) => {
    const count = tally.get(o.id) ?? 0;
    return {
      id: o.id,
      label: o.label,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      mine: myVotedIds.includes(o.id),
    };
  });

  return { options: results, total, myVotedIds };
}
