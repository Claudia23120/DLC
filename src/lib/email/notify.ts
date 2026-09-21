import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendEmail } from "./resend";
import { renderNewEventEmail } from "./templates";
import type { EventKind } from "@/types/database";

/** Every member's email (service role: bypasses RLS to read the full roster). */
async function allMemberEmails(excludeEmail?: string): Promise<string[]> {
  const admin = createServiceRoleClient();
  const { data } = await admin.from("profiles").select("email").eq("member_status", "active");
  return (data ?? [])
    .map((r) => r.email)
    .filter((e): e is string => Boolean(e) && e !== excludeEmail);
}

/**
 * Notify all members that an admin created a new bolo / reunió / votació.
 * No-ops safely when EMAILS_ENABLED is false (handled inside sendEmail).
 */
export async function notifyNewEvent(params: {
  kind: EventKind;
  title: string;
  eventId: string;
  creatorEmail?: string;
}): Promise<void> {
  const siteUrl = process.env.SITE_URL ?? "";
  const url = `${siteUrl}/bolos/${params.eventId}`;
  const { subject, html, text } = renderNewEventEmail({
    kind: params.kind,
    title: params.title,
    url,
  });

  const recipients = await allMemberEmails(params.creatorEmail);
  await sendEmail({ to: recipients, subject, html, text });
}
