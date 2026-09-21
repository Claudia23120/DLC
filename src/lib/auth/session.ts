import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** The authenticated auth user, or null.
 *  Memoized per request so the layout + page don't each re-validate the token. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The current member's profile row, or null if not signed in.
 *  Memoized per request: the layout and the page share one getUser + one query. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
});

/** Require a signed-in member; redirect to /login otherwise.
 *  Inactive members are sent to /compte-inactiu instead. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.member_status === "inactive") redirect("/compte-inactiu");
  return profile;
}

/** Require an admin (board member); redirect otherwise. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.is_admin) redirect("/bolos");
  return profile;
}
