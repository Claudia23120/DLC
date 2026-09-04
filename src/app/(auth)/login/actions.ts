"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/i18n/t";

export interface LoginState {
  error?: string;
}

/** Sign in with email + password (Supabase Auth). No public sign-up. */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: t.auth.genericError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: t.auth.invalidCredentials };
  }

  redirect("/bolos");
}

/** Sign out and return to the login screen. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
