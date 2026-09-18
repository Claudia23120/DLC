import { t } from "@/i18n/t";
import type { EventKind } from "@/types/database";

interface EventEmailInput {
  kind: EventKind;
  title: string;
  url: string;
}

function subjectFor(kind: EventKind, title: string): string {
  switch (kind) {
    case "bolo":
      return t.emails.newBoloSubject(title);
    case "event":
      return t.emails.newMeetingSubject(title);
    case "votacio":
      return t.emails.newPollSubject(title);
  }
}

function bodyFor(kind: EventKind): string {
  switch (kind) {
    case "bolo":
      return t.emails.newBoloBody;
    case "event":
      return t.emails.newMeetingBody;
    case "votacio":
      return t.emails.newPollBody;
  }
}

/** Build the subject + HTML + plain-text for a "new event" notification. */
export function renderNewEventEmail({ kind, title, url }: EventEmailInput) {
  const subject = subjectFor(kind, title);
  const intro = bodyFor(kind);

  const html = `
  <div style="font-family:Figtree,Arial,sans-serif;max-width:520px;margin:0 auto;color:#201e1d">
    <div style="background:#3a0b0a;color:#fdece9;padding:24px;border-radius:16px 16px 0 0">
      <h1 style="margin:0;font-size:22px">${escapeHtml(title)}</h1>
      <p style="margin:6px 0 0;opacity:.8;font-size:13px">${escapeHtml(t.emails.footer)}</p>
    </div>
    <div style="background:#f5ead8;padding:24px;border-radius:0 0 16px 16px">
      <p style="margin:0 0 8px">${escapeHtml(t.emails.greeting)}</p>
      <p style="margin:0 0 20px">${escapeHtml(intro)}</p>
      <a href="${url}" style="display:inline-block;background:#c62f28;color:#f5ead8;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">${escapeHtml(t.emails.cta)}</a>
    </div>
  </div>`;

  const text = `${title}\n\n${t.emails.greeting}\n${intro}\n\n${t.emails.cta}: ${url}`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
