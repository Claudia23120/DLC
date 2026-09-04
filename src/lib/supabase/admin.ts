import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Server-only Supabase client using the SERVICE ROLE key. It BYPASSES RLS,
 * so it must never be imported into client code. Use only for privileged
 * server operations: creating member auth accounts (no public sign-up) and
 * the notification fan-out that reads every member's email.
 */
export function createServiceRoleClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
