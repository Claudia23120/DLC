"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return null;
  return supabase;
}

export async function setCancelledAction(eventId: string, cancelled: boolean) {
  const supabase = await assertAdmin();
  if (!supabase) return;
  await supabase.from("events").update({ cancelled }).eq("id", eventId);
  revalidatePath("/junta");
  revalidatePath(`/bolos/${eventId}`);
}
