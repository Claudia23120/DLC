"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/i18n/t";

export interface ResetPasswordState {
  error?: string;
}

export async function resetPassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!password) return { error: t.auth.genericError };
  if (password !== confirm) return { error: t.auth.passwordMismatch };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: t.auth.genericError };

  redirect("/bolos");
}
