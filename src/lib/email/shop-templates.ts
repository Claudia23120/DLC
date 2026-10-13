import { t } from "@/i18n/t";
import { formatEuros } from "@/lib/domain/shop";
import { escapeHtml } from "./templates";

export interface ShopEmailLine {
  name: string;
  size: string;
  quantity: number;
  /** Units of this line still waiting for stock. */
  backorderedQuantity: number;
  unitPriceCents: number;
}

interface CommonInput {
  reference: string; // "DIABLES-0042"
  memberName: string;
  lines: ShopEmailLine[];
  totalCents: number;
  /** Payable now (units in stock). */
  dueNowCents: number;
  /** Payable once the units pending restock arrive. */
  laterCents: number;
  alreadyTaken: boolean;
}

export interface ShopMemberEmailInput extends CommonInput {
  /** Unique transfer concept, e.g. "DIABLES-0042 Anna Puig". */
  concept: string;
  payment: { iban: string };
}

export interface ShopBoardEmailInput extends CommonInput {
  url: string;
}

function lineLabel(l: ShopEmailLine): string {
  const base = `${l.quantity} × ${l.name} (${l.size})`;
  return l.backorderedQuantity > 0 ? `${base} — ${t.emails.shopBackorderedLine(l.backorderedQuantity)}` : base;
}

function pendingUnits(lines: ShopEmailLine[]): number {
  return lines.reduce((sum, l) => sum + l.backorderedQuantity, 0);
}

function layout(title: string, body: string): string {
  return `
  <div style="font-family:Figtree,Arial,sans-serif;max-width:520px;margin:0 auto;color:#201e1d">
    <div style="background:#3a0b0a;color:#fdece9;padding:24px;border-radius:16px 16px 0 0">
      <h1 style="margin:0;font-size:22px">${escapeHtml(title)}</h1>
      <p style="margin:6px 0 0;opacity:.8;font-size:13px">${escapeHtml(t.emails.footer)}</p>
    </div>
    <div style="background:#f5ead8;padding:24px;border-radius:0 0 16px 16px">${body}</div>
  </div>`;
}

function linesTable(lines: ShopEmailLine[], totalCents: number): string {
  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 0">${escapeHtml(lineLabel(l))}</td>` +
        `<td style="padding:4px 0;text-align:right;white-space:nowrap">${escapeHtml(formatEuros(l.quantity * l.unitPriceCents))}</td></tr>`,
    )
    .join("");
  return (
    `<table style="width:100%;border-collapse:collapse;margin:0 0 16px">${rows}` +
    `<tr><td style="padding:8px 0 0;border-top:1px solid #d9c9ad"><strong>${escapeHtml(t.emails.shopTotal)}</strong></td>` +
    `<td style="padding:8px 0 0;border-top:1px solid #d9c9ad;text-align:right"><strong>${escapeHtml(formatEuros(totalCents))}</strong></td></tr></table>`
  );
}

function amountsHtml(dueNowCents: number, laterCents: number): string {
  const row = (label: string, cents: number) =>
    `<tr><td style="padding:2px 0">${escapeHtml(label)}</td><td style="padding:2px 0;text-align:right">${escapeHtml(formatEuros(cents))}</td></tr>`;
  if (laterCents <= 0) return "";
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 16px">${row(t.emails.shopDueNow, dueNowCents)}${row(t.emails.shopLater, laterCents)}</table>`;
}

function amountsText(dueNowCents: number, laterCents: number): string[] {
  if (laterCents <= 0) return [];
  return [`${t.emails.shopDueNow}: ${formatEuros(dueNowCents)}`, `${t.emails.shopLater}: ${formatEuros(laterCents)}`];
}

function linesText(lines: ShopEmailLine[], totalCents: number): string {
  return [
    ...lines.map((l) => `- ${lineLabel(l)}: ${formatEuros(l.quantity * l.unitPriceCents)}`),
    `${t.emails.shopTotal}: ${formatEuros(totalCents)}`,
  ].join("\n");
}

/** Confirmation sent to the member who placed the order. */
export function renderShopMemberEmail(input: ShopMemberEmailInput) {
  const subject = t.emails.shopMemberSubject(input.reference);
  const note =
    pendingUnits(input.lines) > 0
      ? t.emails.shopBackorderNote
      : input.alreadyTaken
        ? t.emails.shopTakenNote
        : t.emails.shopPendingNote;

  const paymentHtml =
    input.dueNowCents <= 0
      ? ""
      : `<p style="margin:0 0 6px">${escapeHtml(t.emails.shopPayIntro)}</p>
       <div style="background:#fff;border-radius:12px;padding:12px 14px;margin:0 0 16px;font-size:14px">
         <div><strong>${escapeHtml(t.emails.shopIban)}:</strong> ${escapeHtml(input.payment.iban)}</div>
         <div><strong>${escapeHtml(t.emails.shopConcept)}:</strong> ${escapeHtml(input.concept)}</div>
       </div>`;

  const html = layout(
    input.reference,
    `<p style="margin:0 0 8px">${escapeHtml(t.emails.greeting)}</p>
     <p style="margin:0 0 16px">${escapeHtml(t.emails.shopMemberIntro)}</p>
     ${linesTable(input.lines, input.totalCents)}
     ${amountsHtml(input.dueNowCents, input.laterCents)}
     ${paymentHtml}
     <p style="margin:0">${escapeHtml(note)}</p>`,
  );

  const paymentText =
    input.dueNowCents <= 0
      ? ""
      : [
          t.emails.shopPayIntro,
          `${t.emails.shopIban}: ${input.payment.iban}`,
          `${t.emails.shopConcept}: ${input.concept}`,
        ].join("\n");

  const text = [
    input.reference,
    "",
    t.emails.greeting,
    t.emails.shopMemberIntro,
    "",
    linesText(input.lines, input.totalCents),
    ...amountsText(input.dueNowCents, input.laterCents),
    "",
    ...(paymentText ? [paymentText, ""] : []),
    "",
    note,
  ].join("\n");

  return { subject, html, text };
}

/** Notification sent to the board when a new order comes in. */
export function renderShopBoardEmail(input: ShopBoardEmailInput) {
  const subject = t.emails.shopBoardSubject(input.reference, input.memberName);
  const pending = pendingUnits(input.lines);
  const baseStatus = input.alreadyTaken ? t.emails.shopBoardTaken : t.emails.shopBoardPending;
  const status = pending > 0 ? `${baseStatus} ${t.emails.shopBoardBackordered(pending)}` : baseStatus;
  const intro = t.emails.shopBoardIntro(input.memberName);

  const html = layout(
    input.reference,
    `<p style="margin:0 0 16px">${escapeHtml(intro)}</p>
     ${linesTable(input.lines, input.totalCents)}
     ${amountsHtml(input.dueNowCents, input.laterCents)}
     <p style="margin:0 0 20px">${escapeHtml(status)}</p>
     <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#c62f28;color:#f5ead8;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">${escapeHtml(t.emails.shopBoardCta)}</a>`,
  );

  const text = [
    input.reference,
    "",
    intro,
    "",
    linesText(input.lines, input.totalCents),
    ...amountsText(input.dueNowCents, input.laterCents),
    "",
    status,
    "",
    `${t.emails.shopBoardCta}: ${input.url}`,
  ].join("\n");

  return { subject, html, text };
}

export interface ShopReminderEmailInput {
  memberName: string;
  orders: { reference: string; totalCents: number }[];
  totalCents: number;
  payment: { iban: string };
}

/** Payment reminder listing every unpaid order of one member. */
export function renderShopReminderEmail(input: ShopReminderEmailInput) {
  const subject = t.emails.shopReminderSubject;
  const orderLines = input.orders.map((o) => `${o.reference}: ${formatEuros(o.totalCents)}`);

  const ordersHtml = input.orders
    .map(
      (o) =>
        `<tr><td style="padding:4px 0">${escapeHtml(o.reference)}</td>` +
        `<td style="padding:4px 0;text-align:right">${escapeHtml(formatEuros(o.totalCents))}</td></tr>`,
    )
    .join("");
  const paymentHtml = `<div style="background:#fff;border-radius:12px;padding:12px 14px;margin:0 0 16px;font-size:14px">
         <div><strong>${escapeHtml(t.emails.shopIban)}:</strong> ${escapeHtml(input.payment.iban)}</div>
       </div>`;

  const html = layout(
    t.emails.shopReminderSubject,
    `<p style="margin:0 0 8px">${escapeHtml(t.emails.greeting)}</p>
     <p style="margin:0 0 16px">${escapeHtml(t.emails.shopReminderIntro)}</p>
     <table style="width:100%;border-collapse:collapse;margin:0 0 16px">${ordersHtml}
       <tr><td style="padding:8px 0 0;border-top:1px solid #d9c9ad"><strong>${escapeHtml(t.emails.shopReminderTotal)}</strong></td>
       <td style="padding:8px 0 0;border-top:1px solid #d9c9ad;text-align:right"><strong>${escapeHtml(formatEuros(input.totalCents))}</strong></td></tr>
     </table>
     ${paymentHtml}
     <p style="margin:0">${escapeHtml(t.emails.shopReminderHow)}</p>`,
  );

  const text = [
    t.emails.greeting,
    t.emails.shopReminderIntro,
    "",
    ...orderLines,
    `${t.emails.shopReminderTotal}: ${formatEuros(input.totalCents)}`,
    "",
    `${t.emails.shopIban}: ${input.payment.iban}`,
    "",
    t.emails.shopReminderHow,
  ].join("\n");

  return { subject, html, text };
}
