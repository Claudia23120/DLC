import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { orderReference, transferConcept } from "@/lib/domain/shop";
import type { ShopOrderView, ShopPaymentInfo } from "@/lib/data/shop";
import { sendEmail } from "./resend";
import {
  renderShopBoardEmail,
  renderShopMemberEmail,
  renderShopReminderEmail,
  type ShopEmailLine,
} from "./shop-templates";

/** Emails of the active board members (service role: reads the roster past RLS). */
async function boardEmails(): Promise<string[]> {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("is_admin", true)
    .eq("member_status", "active");
  return (data ?? []).map((r) => r.email).filter((e): e is string => Boolean(e));
}

function emailLines(order: ShopOrderView): ShopEmailLine[] {
  return order.lines.map((l) => ({
    name: l.itemName ?? "—",
    size: l.size ?? "—",
    quantity: l.quantity,
    backorderedQuantity: l.backorderedQuantity,
    unitPriceCents: l.unit_price_cents,
  }));
}

/**
 * After an order is placed: one email to the member (summary + transfer
 * details) and one to the board. The two sends are independent, and neither
 * can fail the order — errors are only logged. No-ops while EMAILS_ENABLED is false.
 */
export async function notifyShopOrder(params: {
  order: ShopOrderView;
  member: { full_name: string; email: string };
  payment: ShopPaymentInfo;
}): Promise<void> {
  const { order, member, payment } = params;
  const reference = orderReference(order.order_number);
  const lines = emailLines(order);
  // An order with pending units is never delivered (the DB forces it), so "already taken" is only true when fully covered.
  const alreadyTaken = order.delivery_status === "delivered";
  const common = {
    reference,
    memberName: member.full_name,
    lines,
    totalCents: order.total_cents,
    dueNowCents: order.due_cents,
    laterCents: order.pending_cents,
    alreadyTaken,
  };

  const memberMail = renderShopMemberEmail({
    ...common,
    concept: transferConcept(order.order_number, member.full_name),
    payment,
  });
  const boardMail = renderShopBoardEmail({ ...common, url: `${process.env.SITE_URL ?? ""}/junta` });

  const results = await Promise.allSettled([
    sendEmail({ to: [member.email], ...memberMail }),
    boardEmails().then((to) => sendEmail({ to, ...boardMail })),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("[shop] order email failed:", r.reason);
  }
}

export interface ShopReminderTarget {
  member: { full_name: string; email: string };
  /** Amount due right now on each order (units pending restock excluded). */
  orders: { order_number: number; due_cents: number }[];
}

/**
 * Send each target one payment reminder listing their unpaid orders. Returns
 * how many were sent (counted even while EMAILS_ENABLED is false, since
 * sendEmail then just logs); one failing recipient doesn't stop the others.
 */
export async function sendShopReminders(
  targets: ShopReminderTarget[],
  payment: ShopPaymentInfo,
): Promise<number> {
  let sent = 0;
  for (const { member, orders } of targets) {
    if (orders.length === 0) continue;
    const mail = renderShopReminderEmail({
      memberName: member.full_name,
      orders: orders.map((o) => ({ reference: orderReference(o.order_number), totalCents: o.due_cents })),
      totalCents: orders.reduce((sum, o) => sum + o.due_cents, 0),
      payment,
    });
    try {
      await sendEmail({ to: [member.email], ...mail });
      sent++;
    } catch (e) {
      console.error("[shop] reminder email failed:", e);
    }
  }
  return sent;
}
