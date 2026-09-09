import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** The authenticated auth user, or null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The current member's profile row, or null if not signed in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

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
