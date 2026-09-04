"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MeetingResponse } from "@/types/database";

/** Set (or change) the current member's response to a meeting. */
export async function setMeetingAttendance(
  eventId: string,
  response: MeetingResponse,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("meeting_attendance")
    .upsert({ event_id: eventId, member_id: user.id, response }, { onConflict: "event_id,member_id" });

  revalidatePath(`/reunions/${eventId}`);
  revalidatePath("/bolos");
}

export interface CastVoteResult {
  error?: string;
}

/** Cast (or change) the current member's vote in a poll. */
export async function castVote(eventId: string, optionId: string): Promise<CastVoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticat" };

  const { error } = await supabase
    .from("poll_votes")
    .upsert(
      { event_id: eventId, option_id: optionId, member_id: user.id },
      { onConflict: "event_id,member_id" },
    );

  // The guard_poll_open trigger rejects votes after closes_at.
  if (error) return { error: "La votació ja està tancada" };

  revalidatePath(`/reunions/votacions/${eventId}`);
  revalidatePath("/bolos");
  return {};
}
