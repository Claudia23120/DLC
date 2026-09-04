import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { MeetingResponse } from "@/types/database";

type DB = Awaited<ReturnType<typeof createClient>>;

/** Members who confirmed attendance ("hi seré") to a meeting. */
export async function getMeetingAttendees(supabase: DB, eventId: string): Promise<string[]> {
  const { data } = await supabase
    .from("meeting_attendance")
    .select("response, profiles!inner(full_name)")
    .eq("event_id", eventId)
    .eq("response", "yes");

  return (data ?? []).map((row) => (row.profiles as unknown as { full_name: string }).full_name);
}

/** The current member's response to a meeting, or null. */
export async function getMyMeetingResponse(
  supabase: DB,
  eventId: string,
  userId: string,
): Promise<MeetingResponse | null> {
  const { data } = await supabase
    .from("meeting_attendance")
    .select("response")
    .eq("event_id", eventId)
    .eq("member_id", userId)
    .maybeSingle();
  return (data?.response as MeetingResponse) ?? null;
}
