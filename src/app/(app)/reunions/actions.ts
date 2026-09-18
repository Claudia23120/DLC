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

/** Cast (or toggle) the current member's vote in a poll. */
export async function castVote(eventId: string, optionId: string, allowMultiple: boolean): Promise<CastVoteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticat" };

  if (allowMultiple) {
    // Toggle: remove if already voted, add if not.
    const { data: existing } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("event_id", eventId)
      .eq("member_id", user.id)
      .eq("option_id", optionId)
      .maybeSingle();

    if (existing) {
      await supabase.from("poll_votes").delete()
        .eq("event_id", eventId).eq("member_id", user.id).eq("option_id", optionId);
    } else {
      const { error } = await supabase.from("poll_votes")
        .insert({ event_id: eventId, option_id: optionId, member_id: user.id });
      if (error) return { error: "La votació ja està tancada" };
    }
  } else {
    // Single-select: replace any existing vote.
    await supabase.from("poll_votes").delete()
      .eq("event_id", eventId).eq("member_id", user.id);
    const { error } = await supabase.from("poll_votes")
      .insert({ event_id: eventId, option_id: optionId, member_id: user.id });
    if (error) return { error: "La votació ja està tancada" };
  }

  revalidatePath(`/reunions/votacions/${eventId}`);
  revalidatePath("/bolos");
  return {};
}
