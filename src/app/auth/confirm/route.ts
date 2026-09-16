import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Handles Supabase email confirmation links (password reset, magic link, etc.).
 *
 * Supabase redirects here in two formats depending on the project's auth flow:
 *   - PKCE (default for new projects): ?code=CODE
 *   - OTP direct:                      ?token_hash=HASH&type=TYPE
 *
 * The caller adds ?next=/path so this handler knows where to send the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "";
  const next = searchParams.get("next") ?? "/bolos";

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    },
  );

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
