import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { BoloResponse } from "@/types/database";

type DB = Awaited<ReturnType<typeof createClient>>;

const PARTICIPATING: BoloResponse[] = ["diable", "tabaler", "supporter"];

export interface BoloStats {
  participated: number;
  declined: number;
  noResponse: number;
  /** Bolos published since the member joined (all bolos when there's no joined date). */
  total: number;
}

/**
 * How a member has answered the published bolos. Bolos before `joinedDate`
 * don't count, since the member wasn't part of the colla yet.
 */
export async function getBoloStats(
  supabase: DB,
  memberId: string,
  joinedDate: string | null,
): Promise<BoloStats> {
  const [attendanceResult, bolosResult] = await Promise.all([
    supabase.from("bolo_attendance").select("response, event_id").eq("member_id", memberId),
    supabase.from("events").select("id, starts_at").eq("kind", "bolo"),
  ]);

  const counts = (date: string | null | undefined) => !joinedDate || !date || date >= joinedDate;

  const dateById = new Map((bolosResult.data ?? []).map((b) => [b.id, b.starts_at]));
  const total = [...dateById.values()].filter(counts).length;

  const attendance = (attendanceResult.data ?? []).filter((a) => counts(dateById.get(a.event_id)));

  return {
    participated: attendance.filter((a) => PARTICIPATING.includes(a.response)).length,
    declined: attendance.filter((a) => a.response === "no").length,
    noResponse: Math.max(0, total - attendance.length),
    total,
  };
}
