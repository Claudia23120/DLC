import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * Thin email wrapper (Resend, or plain SMTP for local dev — see below) with a global feature flag. Until a sending domain is
 * verified in Resend, set EMAILS_ENABLED=false: sends are skipped and logged
 * instead, so the rest of the app works unchanged. Flip the flag (no code
 * changes) once the domain is verified.
 *
 * Local testing: set SMTP_HOST (e.g. a Mailpit container on port 1025) and
 * mail goes there instead of Resend, so you can read it in a web inbox without
 * a verified domain or real recipients.
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

  const smtpHost = process.env.SMTP_HOST;
  const from = process.env.EMAIL_FROM;
  if (smtpHost) {
    await sendViaSmtp({ host: smtpHost, from: from ?? "avisos@localhost", to, subject, html, text });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
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

/** Plain SMTP (no TLS / auth by default: meant for Mailpit / MailCatcher). */
async function sendViaSmtp(opts: SendEmailInput & { host: string; from: string }): Promise<void> {
  const user = process.env.SMTP_USER;
  const transport = nodemailer.createTransport({
    host: opts.host,
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    auth: user ? { user, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
  try {
    await transport.sendMail({
      from: opts.from,
      to: opts.from, // same as Resend: visible To = the club, members in BCC
      bcc: opts.to,
      replyTo: process.env.EMAIL_REPLY_TO,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.info(`[email:smtp] Sent "${opts.subject}" to ${opts.to.length} recipient(s) via ${opts.host}.`);
  } catch (error) {
    console.error("[email] SMTP error:", error);
  }
}
