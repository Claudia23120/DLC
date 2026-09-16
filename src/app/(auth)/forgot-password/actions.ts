"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/i18n/t";

export interface ForgotPasswordState {
  error?: string;
  sent?: boolean;
}

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: t.auth.genericError };

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";
  const redirectTo = `${origin}/auth/confirm?next=/reset-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // Always show "sent" even if the email doesn't exist (avoids user enumeration).
  if (error) console.error("[resetPassword]", error.message);
  return { sent: true };
}
