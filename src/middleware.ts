import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except Next.js internals, static assets and fonts.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)",
  ],
};
