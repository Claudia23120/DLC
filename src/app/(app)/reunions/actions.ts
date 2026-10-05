"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CastVoteResult {
  error?: string;
}

/**
 * Cast (or toggle) the current member's vote in a poll. Whether the poll is
 * single or multiple choice, and whether it is still open, is decided by the
 * database function, not by the client.
 */
export async function castVote(eventId: string, optionId: string): Promise<CastVoteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticat" };

  const { error } = await supabase.rpc("cast_vote", { p_event_id: eventId, p_option_id: optionId });
  if (error) return { error: error.message };

  revalidatePath(`/reunions/votacions/${eventId}`);
  revalidatePath("/bolos");
  return {};
}
