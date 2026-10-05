import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils/safe-redirect";

/**
 * Handles Supabase email confirmation links (password reset, magic link, etc.).
 *
 * Supabase redirects here in two formats depending on the project's auth flow:
 *   - PKCE (default for new projects): ?code=CODE
 *   - OTP direct:                      ?token_hash=HASH&type=TYPE
 *
 * The caller adds ?next=/path so this handler knows where to send the user.
 */
/**
 * POST: the "Continua" button on /auth/verify. Verifies the one-time token only
 * now, so mail scanners that pre-open the emailed link can't burn it.
 */
export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  const form = await request.formData();
  const token_hash = String(form.get("token_hash") ?? "");
  const type = String(form.get("type") ?? "");
  const next = safeNextPath(String(form.get("next") ?? "") || null);

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as EmailOtpType });
    if (!error) return NextResponse.redirect(`${origin}${next}`, 303);
  }
  return NextResponse.redirect(`${origin}/login?error=link-invalid`, 303);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "";
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  // PKCE flow — Supabase sends ?code=CODE after its own server-side verification.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // OTP / token_hash flow — older Supabase projects or direct OTP links.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-invalid`);
}
