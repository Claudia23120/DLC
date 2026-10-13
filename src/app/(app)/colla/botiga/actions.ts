"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOrder, getShopPaymentInfo } from "@/lib/data/shop";
import { notifyShopOrder } from "@/lib/email/shop-notify";
import {
  backorderedUnits,
  orderReference,
  transferConcept,
  validateCart,
  type CartError,
  type StockInfo,
} from "@/lib/domain/shop";
import { t } from "@/i18n/t";

export interface PlaceOrderInput {
  lines: { variantId: string; quantity: number }[];
  /** The member already took the garments from the warehouse. */
  alreadyTaken: boolean;
}

export type PlaceOrderResult =
  | { ok: true; reference: string; totalCents: number; concept: string; backorderedUnits: number; dueCents: number; laterCents: number }
  | { ok: false; error: string };

function cartErrorMessage(e: CartError): string {
  switch (e.code) {
    case "empty":
    case "too_many_lines":
      return t.shop.errEmpty;
    case "invalid_quantity":
      return t.shop.errQuantity;
    case "unknown_variant":
      return t.shop.errUnknownVariant;
    case "insufficient_stock":
      return t.shop.errStock;
  }
}

/** Parse untrusted client input into a clean line list, or null if malformed. */
function parseLines(raw: unknown): PlaceOrderInput["lines"] | null {
  if (!Array.isArray(raw)) return null;
  const lines: PlaceOrderInput["lines"] = [];
  for (const l of raw) {
    if (!l || typeof l.variantId !== "string" || typeof l.quantity !== "number") return null;
    lines.push({ variantId: l.variantId, quantity: l.quantity });
  }
  return lines;
}

/**
 * Place an order for the signed-in member. Stock, prices, backorders and the
 * total are decided in the database (create_shop_order); the stock pre-check
 * here only gives friendlier errors. Emails (member + board) are sent afterwards and can
 * never make the order fail.
 */
export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.member_status === "inactive") {
    return { ok: false, error: t.shop.errNotSignedIn };
  }

  const lines = parseLines(input?.lines);
  if (!lines) return { ok: false, error: t.shop.errGeneric };

  const supabase = await createClient();

  const { data: variants } = await supabase
    .from("shop_item_variants")
    .select("id, stock, shop_items(allow_backorder)")
    .in("id", lines.map((l) => l.variantId));
  const stock: Record<string, StockInfo> = {};
  for (const v of (variants ?? []) as unknown as { id: string; stock: number; shop_items: { allow_backorder: boolean } | null }[]) {
    stock[v.id] = { stock: v.stock, allowBackorder: v.shop_items?.allow_backorder === true };
  }
  const cartErrors = validateCart(lines, stock);
  if (cartErrors.length > 0) return { ok: false, error: cartErrorMessage(cartErrors[0]) };

  const { data: order, error } = await supabase.rpc("create_shop_order", {
    p_lines: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
    p_already_taken: input.alreadyTaken === true,
    p_notes: null,
  });
  if (error || !order) {
    console.error("[shop] create_shop_order failed:", error);
    // The RPC re-checks stock under lock; losing a race is the likely cause.
    return { ok: false, error: error?.message.includes("estoc") ? t.shop.errStock : t.shop.errGeneric };
  }

  const full = await getOrder(supabase, order.id);
  const pendingUnits = full ? backorderedUnits(full.lines) : 0;
  if (full) {
    await notifyShopOrder({
      order: full,
      member: { full_name: profile.full_name, email: profile.email },
      payment: getShopPaymentInfo(),
    });
  }

  revalidatePath("/colla/botiga");
  revalidatePath("/junta");

  return {
    ok: true,
    reference: orderReference(order.order_number),
    totalCents: order.total_cents,
    // What to pay now vs. when the pending pieces arrive (the full total if the order couldn't be re-read).
    dueCents: full ? full.due_cents : order.total_cents,
    laterCents: full ? full.pending_cents : 0,
    concept: transferConcept(order.order_number, profile.full_name),
    backorderedUnits: pendingUnits,
  };
}
