"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/session";
import { getShopPaymentInfo, listAllOrders } from "@/lib/data/shop";
import { sendShopReminders, type ShopReminderTarget } from "@/lib/email/shop-notify";
import {
  canMarkDelivered,
  deliveredPatch,
  parsePriceToCents,
  pendingPatch,
  unpaidPatch,
  validateVariants,
  type VariantError,
} from "@/lib/domain/shop";
import { t } from "@/i18n/t";
import type { ShopPaymentMethod } from "@/types/database";

export interface ShopActionResult {
  ok?: boolean;
  error?: string;
  /** Human-readable outcome (e.g. "Recordatoris enviats: 3"). */
  message?: string;
}

const METHODS: ShopPaymentMethod[] = ["transfer", "cash", "other"];

function refresh() {
  revalidatePath("/junta");
  revalidatePath("/colla/botiga");
}

// ── Order states ────────────────────────────────────────────────────────

/**
 * Record a payment of everything covered by stock right now (date + method),
 * or undo all payments. Units still pending restock are not charged until
 * they arrive; the amount is computed in the database so a simultaneous
 * restock can't make it wrong.
 */
export async function setOrderPaymentAction(
  orderId: string,
  paid: boolean,
  method: ShopPaymentMethod = "transfer",
): Promise<ShopActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };

  if (paid) {
    if (!METHODS.includes(method)) return { error: t.shopAdmin.errGeneric };
    const { error } = await ctx.supabase.rpc("mark_shop_order_paid", { p_order_id: orderId, p_method: method });
    if (error) {
      return { error: error.message.includes("res pendent") ? t.shopAdmin.errNothingDue : t.shopAdmin.errGeneric };
    }
  } else {
    const { error } = await ctx.supabase.from("shop_orders").update(unpaidPatch()).eq("id", orderId);
    if (error) return { error: t.shopAdmin.errGeneric };
  }
  refresh();
  return { ok: true };
}

/** Mark an order delivered (stamping today) or undo it. */
export async function setOrderDeliveryAction(orderId: string, delivered: boolean): Promise<ShopActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };

  if (delivered) {
    // Pieces still waiting for stock can't have been handed over.
    const { data: lines } = await ctx.supabase
      .from("shop_order_lines")
      .select("backordered_quantity")
      .eq("order_id", orderId);
    if (!canMarkDelivered((lines ?? []).map((l) => ({ backorderedQuantity: l.backordered_quantity })))) {
      return { error: t.shopAdmin.errBackordered };
    }
  }

  const patch = delivered ? deliveredPatch(new Date()) : pendingPatch();
  const { error } = await ctx.supabase.from("shop_orders").update(patch).eq("id", orderId);
  if (error) return { error: t.shopAdmin.errGeneric };
  refresh();
  return { ok: true };
}

// ── Catalogue ───────────────────────────────────────────────────────────

export interface ShopItemInput {
  id?: string;
  name: string;
  description: string;
  /** Price as typed by the board ("15,50"). */
  price: string;
  imageUrl: string;
  active: boolean;
  allowBackorder: boolean;
  variants: { id?: string; size: string; stock: number }[];
}

function variantErrorMessage(e: VariantError): string {
  switch (e.code) {
    case "no_variants":
      return t.shopAdmin.errNoVariants;
    case "empty_size":
      return t.shopAdmin.errEmptySize;
    case "duplicate_size":
      return t.shopAdmin.errDuplicateSize(e.size);
    case "invalid_stock":
      return t.shopAdmin.errStockInvalid(e.size);
  }
}

/** Create or update an item with its sizes and stock. */
export async function saveShopItemAction(input: ShopItemInput): Promise<ShopActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };
  const { supabase } = ctx;

  const name = String(input?.name ?? "").trim();
  if (!name) return { error: t.shopAdmin.errNameRequired };
  const priceCents = parsePriceToCents(String(input.price ?? ""));
  if (priceCents === null) return { error: t.shopAdmin.errPrice };

  const variants = (input.variants ?? []).map((v) => ({
    id: v.id,
    size: String(v.size ?? "").trim(),
    stock: Number(v.stock),
  }));
  const variantErrors = validateVariants(variants);
  if (variantErrors.length > 0) return { error: variantErrorMessage(variantErrors[0]) };

  const fields = {
    name,
    description: String(input.description ?? "").trim() || null,
    price_cents: priceCents,
    image_url: String(input.imageUrl ?? "").trim() || null,
    active: input.active === true,
    allow_backorder: input.allowBackorder === true,
  };

  let itemId = input.id;
  if (itemId) {
    const { error } = await supabase.from("shop_items").update(fields).eq("id", itemId);
    if (error) return { error: t.shopAdmin.errGeneric };
  } else {
    const { data, error } = await supabase.from("shop_items").insert(fields).select("id").single();
    if (error || !data) return { error: t.shopAdmin.errGeneric };
    itemId = data.id;
  }

  // Sizes the board removed. A size that already appears in an order can't be
  // deleted (FK restrict) — ask them to zero its stock instead.
  const { data: existing } = await supabase.from("shop_item_variants").select("id").eq("item_id", itemId);
  const keep = new Set(variants.map((v) => v.id).filter(Boolean));
  const removed = (existing ?? []).map((v) => v.id).filter((id) => !keep.has(id));
  if (removed.length > 0) {
    const { error } = await supabase.from("shop_item_variants").delete().in("id", removed);
    if (error) return { error: t.shopAdmin.errVariantInUse };
  }

  for (const v of variants) {
    const { error } = v.id
      ? await supabase.from("shop_item_variants").update({ size: v.size, stock: v.stock }).eq("id", v.id).eq("item_id", itemId)
      : await supabase.from("shop_item_variants").insert({ item_id: itemId, size: v.size, stock: v.stock });
    if (error) return { error: t.shopAdmin.errGeneric };
  }

  // Stock typed in by hand may now cover orders that were waiting for it:
  // assign it to the oldest pending lines (restocking 0 units just runs that).
  for (const v of variants) {
    if (!v.id || v.stock <= 0) continue;
    const { error } = await supabase.rpc("restock_shop_variant", { p_variant_id: v.id, p_quantity: 0 });
    if (error) return { error: t.shopAdmin.errGeneric };
  }

  refresh();
  return { ok: true };
}

/** Units received for a variant: assigned to the oldest pending orders first, the rest becomes free stock. */
export async function restockShopVariantAction(variantId: string, quantity: number): Promise<ShopActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    return { error: t.shopAdmin.errRestockQuantity };
  }

  const { error } = await ctx.supabase.rpc("restock_shop_variant", { p_variant_id: variantId, p_quantity: quantity });
  if (error) return { error: t.shopAdmin.errGeneric };
  refresh();
  return { ok: true, message: t.shopAdmin.restockDone };
}

export async function setShopItemActiveAction(itemId: string, active: boolean): Promise<ShopActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };
  const { error } = await ctx.supabase.from("shop_items").update({ active }).eq("id", itemId);
  if (error) return { error: t.shopAdmin.errGeneric };
  refresh();
  return { ok: true };
}

// ── Payment reminders ───────────────────────────────────────────────────

/**
 * Email a payment reminder listing the orders with something due of one member, or of every
 * member with something pending when `memberId` is null. Manual only (no cron).
 */
export async function sendShopRemindersAction(memberId: string | null): Promise<ShopActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };
  const { supabase } = ctx;

  // Only what is due right now: units pending restock are not chargeable yet.
  const orders = (await listAllOrders(supabase)).filter(
    (o) => o.due_cents > 0 && (!memberId || o.member_id === memberId),
  );
  if (orders.length === 0) return { ok: true, message: t.shopAdmin.remindersNone };

  const memberIds = [...new Set(orders.map((o) => o.member_id))];
  const { data: members } = await supabase.from("profiles").select("id, full_name, email").in("id", memberIds);

  const targets: ShopReminderTarget[] = (members ?? []).map((m) => ({
    member: { full_name: m.full_name, email: m.email },
    orders: orders
      .filter((o) => o.member_id === m.id)
      .sort((a, b) => a.order_number - b.order_number)
      .map((o) => ({ order_number: o.order_number, due_cents: o.due_cents })),
  }));

  const sent = await sendShopReminders(targets, getShopPaymentInfo());
  return { ok: true, message: t.shopAdmin.remindersSent(sent) };
}
