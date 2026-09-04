import { Resend } from "resend";

/**
 * Thin Resend wrapper with a global feature flag. Until a sending domain is
 * verified in Resend, set EMAILS_ENABLED=false: sends are skipped and logged
 * instead, so the rest of the app works unchanged. Flip the flag (no code
 * changes) once the domain is verified.
 */
const EMAILS_ENABLED = process.env.EMAILS_ENABLED === "true";

export interface SendEmailInput {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  if (to.length === 0) return;

  if (!EMAILS_ENABLED) {
    console.info(
      `[email:disabled] Would send "${subject}" to ${to.length} recipient(s). ` +
        "Set EMAILS_ENABLED=true after verifying the Resend domain.",
    );
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[email] RESEND_API_KEY or EMAIL_FROM missing; skipping send.");
    return;
  }

  const resend = new Resend(apiKey);
  const replyTo = process.env.EMAIL_REPLY_TO;

  // Fan out in batches; recipients go in BCC so members don't see each other.
  const BATCH = 50;
  for (let i = 0; i < to.length; i += BATCH) {
    const batch = to.slice(i, i + BATCH);
    const { error } = await resend.emails.send({
      from,
      to: from, // visible To = the club; real recipients are BCC'd
      bcc: batch,
      replyTo,
      subject,
      html,
      text,
    });
    if (error) console.error("[email] Resend error:", error);
  }
}
