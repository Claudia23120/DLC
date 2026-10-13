/**
 * Botiga (club shop) domain logic: pure functions, no I/O.
 *
 * Delivery and payment are INDEPENDENT states of an order. The database is the
 * source of truth (create_shop_order enforces stock and prices atomically);
 * these helpers drive the UI, the board's filters/totals and the patches the
 * board's server actions write, so the rules live in one tested place.
 */
import type {
  ShopDeliveryStatus,
  ShopPaymentMethod,
  ShopPaymentStatus,
} from "@/types/database";

export const MAX_LINE_QUANTITY = 99;
export const MAX_CART_LINES = 50;

// ── Money & references ──────────────────────────────────────────────────

const euros = new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR" });

/** 1500 → "15,00 €". */
export function formatEuros(cents: number): string {
  return euros.format(cents / 100);
}

/** 42 → "DIABLES-0042". */
export function orderReference(orderNumber: number): string {
  return `DIABLES-${String(orderNumber).padStart(4, "0")}`;
}

/** Unique bank-transfer concept: reference + member name (e.g. "DIABLES-0042 Anna Puig"). */
export function transferConcept(orderNumber: number, memberName: string): string {
  const name = memberName.trim().replace(/\s+/g, " ");
  return name ? `${orderReference(orderNumber)} ${name}` : orderReference(orderNumber);
}

/**
 * Parse a price typed by the board ("15", "15,5", "15.50", "1.234,50") into cents.
 * Returns null for empty, negative, non-numeric or sub-cent input.
 */
export function parsePriceToCents(input: string): number | null {
  let s = input.replace(/[€\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); // "1.234,50" → "1234.50"
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** 1500 → "15,00" (value for a price input; no currency symbol). */
export function centsToPriceInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export interface VariantInput {
  size: string;
  stock: number;
}

export type VariantError =
  | { code: "no_variants" }
  | { code: "empty_size" }
  | { code: "duplicate_size"; size: string }
  | { code: "invalid_stock"; size: string };

/** Board-side validation of an item's sizes: at least one, unique (case-insensitive), stock a whole number ≥ 0. */
export function validateVariants(variants: VariantInput[]): VariantError[] {
  if (variants.length === 0) return [{ code: "no_variants" }];
  const errors: VariantError[] = [];
  const seen = new Set<string>();
  for (const v of variants) {
    const size = v.size.trim();
    if (!size) {
      errors.push({ code: "empty_size" });
      continue;
    }
    const key = size.toLowerCase();
    if (seen.has(key)) errors.push({ code: "duplicate_size", size });
    seen.add(key);
    if (!Number.isInteger(v.stock) || v.stock < 0) errors.push({ code: "invalid_stock", size });
  }
  return errors;
}

// ── Sizes ───────────────────────────────────────────────────────────────

const SIZE_ORDER = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "3xl", "4xl", "única", "unica"];

/** Sort sizes the way people expect: XS < S < M < L < XL…, numbers ascending, then the rest A–Z. */
export function compareSizes(a: string, b: string): number {
  const rank = (size: string) => {
    const s = size.trim().toLowerCase();
    const i = SIZE_ORDER.indexOf(s);
    if (i >= 0) return { group: 0, n: i, s };
    if (/^\d+$/.test(s)) return { group: 1, n: Number(s), s };
    return { group: 2, n: 0, s };
  };
  const ra = rank(a);
  const rb = rank(b);
  if (ra.group !== rb.group) return ra.group - rb.group;
  if (ra.n !== rb.n) return ra.n - rb.n;
  return ra.s.localeCompare(rb.s, "ca");
}

// ── Cart ────────────────────────────────────────────────────────────────

export interface CartLine {
  variantId: string;
  quantity: number;
  unitPriceCents: number;
}

export function orderTotal(lines: Pick<CartLine, "quantity" | "unitPriceCents">[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0);
}

export type CartError =
  | { code: "empty" }
  | { code: "too_many_lines" }
  | { code: "invalid_quantity"; variantId: string }
  | { code: "unknown_variant"; variantId: string }
  | { code: "insufficient_stock"; variantId: string; available: number };

/** What the shop knows about a variant when checking a cart. */
export interface StockInfo {
  /** Units free right now. */
  stock: number;
  /** The item accepts orders beyond stock (the rest stays "pendent de reposició"). */
  allowBackorder: boolean;
}

/**
 * Mirror of the checks create_shop_order() makes, so the UI can reject early.
 * Lines for the same variant are summed before comparing with stock. Asking
 * for more than the stock is an error only when the item does not allow
 * backorders. A variant missing from `stock` is unknown.
 */
export function validateCart(
  lines: Pick<CartLine, "variantId" | "quantity">[],
  stock: Record<string, StockInfo>,
): CartError[] {
  if (lines.length === 0) return [{ code: "empty" }];
  if (lines.length > MAX_CART_LINES) return [{ code: "too_many_lines" }];

  const errors: CartError[] = [];
  const perVariant = new Map<string, number>();
  for (const l of lines) {
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > MAX_LINE_QUANTITY) {
      errors.push({ code: "invalid_quantity", variantId: l.variantId });
      continue;
    }
    perVariant.set(l.variantId, (perVariant.get(l.variantId) ?? 0) + l.quantity);
  }

  for (const [variantId, qty] of perVariant) {
    const info = stock[variantId];
    if (info === undefined) errors.push({ code: "unknown_variant", variantId });
    else if (qty > MAX_LINE_QUANTITY) errors.push({ code: "invalid_quantity", variantId });
    else if (qty > info.stock && !info.allowBackorder) {
      errors.push({ code: "insufficient_stock", variantId, available: info.stock });
    }
  }
  return errors;
}

/**
 * How a line splits when ordered: units reserved from stock now, and units
 * left pending restock. Mirrors create_shop_order(): take what exists, the
 * rest waits.
 */
export function splitByStock(quantity: number, stock: number): { reserved: number; backordered: number } {
  const reserved = Math.max(0, Math.min(quantity, stock));
  return { reserved, backordered: quantity - reserved };
}

export interface BackorderLine {
  variantId: string;
  backorderedQuantity: number;
}

/** Total units across lines still waiting for stock. */
export function backorderedUnits(lines: Pick<BackorderLine, "backorderedQuantity">[]): number {
  return lines.reduce((sum, l) => sum + l.backorderedQuantity, 0);
}

/** An order can only be handed over once every line is covered by stock. */
export function canMarkDelivered(lines: Pick<BackorderLine, "backorderedQuantity">[]): boolean {
  return backorderedUnits(lines) === 0;
}

/** Variant id → units the board still has to get (sum of pending units; variants with none are omitted). */
export function pendingRestock(lines: BackorderLine[]): Map<string, number> {
  const pending = new Map<string, number>();
  for (const l of lines) {
    if (l.backorderedQuantity <= 0) continue;
    pending.set(l.variantId, (pending.get(l.variantId) ?? 0) + l.backorderedQuantity);
  }
  return pending;
}

// ── What is payable now vs. when stock arrives ─────────────────────────

export interface PricedLine {
  quantity: number;
  /** Units of this line still waiting for stock. */
  backorderedQuantity: number;
  unitPriceCents: number;
}

/** Value of the units already reserved from stock (what can be paid now). */
export function coveredCents(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + (l.quantity - l.backorderedQuantity) * l.unitPriceCents, 0);
}

/** Value of the units still pending restock (paid once they arrive). */
export function pendingCents(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + l.backorderedQuantity * l.unitPriceCents, 0);
}

/** What the member owes right now: covered units not yet paid for. */
export function amountDueCents(lines: PricedLine[], paidCents: number): number {
  return Math.max(0, coveredCents(lines) - paidCents);
}

/** Cart split into "pay now" (units in stock) and "pay later" (units pending restock). */
export function cartTotals(
  entries: { quantity: number; stock: number; unitPriceCents: number }[],
): { dueNowCents: number; laterCents: number } {
  let dueNowCents = 0;
  let laterCents = 0;
  for (const e of entries) {
    const { reserved, backordered } = splitByStock(e.quantity, e.stock);
    dueNowCents += reserved * e.unitPriceCents;
    laterCents += backordered * e.unitPriceCents;
  }
  return { dueNowCents, laterCents };
}

// ── State transitions (patches the board writes) ───────────────────────

export interface DeliveryPatch {
  delivery_status: ShopDeliveryStatus;
  delivered_at: string | null;
}

/** Undo a payment (the board's "desfés"): nothing paid, no date, no method. */
export interface UnpaidPatch {
  payment_status: ShopPaymentStatus;
  paid_cents: number;
  paid_at: string | null;
  payment_method: ShopPaymentMethod | null;
}

/** Deliver: stamps `now` as the delivery date. */
export function deliveredPatch(now: Date): DeliveryPatch {
  return { delivery_status: "delivered", delivered_at: now.toISOString() };
}

/** Undo a delivery mistake. */
export function pendingPatch(): DeliveryPatch {
  return { delivery_status: "pending", delivered_at: null };
}

/**
 * Undo payments. Marking an order paid is NOT a patch: it records exactly what
 * is covered by stock at that moment, so it lives in the database
 * (mark_shop_order_paid).
 */
export function unpaidPatch(): UnpaidPatch {
  return { payment_status: "unpaid", paid_cents: 0, paid_at: null, payment_method: null };
}

// ── Board views ─────────────────────────────────────────────────────────

export interface OrderState {
  delivery_status: ShopDeliveryStatus;
  payment_status: ShopPaymentStatus;
  /** Amount owed right now (see amountDueCents). */
  due_cents: number;
}

export type OrderFilter = "all" | "to_deliver" | "to_collect" | "closed";

/** Not handed over yet. */
export function needsDelivery(o: OrderState): boolean {
  return o.delivery_status === "pending";
}

/** Something to collect now — includes garments already taken but unpaid. Pending-restock units don't count until they arrive. */
export function needsPayment(o: OrderState): boolean {
  return o.due_cents > 0;
}

/** Delivered AND fully paid. */
export function isClosed(o: OrderState): boolean {
  return o.delivery_status === "delivered" && o.payment_status === "paid";
}

export function matchesOrderFilter(o: OrderState, filter: OrderFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "to_deliver":
      return needsDelivery(o);
    case "to_collect":
      return needsPayment(o);
    case "closed":
      return isClosed(o);
  }
}

/** Search by member name/nickname or order number ("42", "0042" or "DIABLES-0042"). */
export function matchesOrderSearch(
  o: { order_number: number; memberName: string; memberNickname?: string | null },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (`${o.memberName} ${o.memberNickname ?? ""}`.toLowerCase().includes(q)) return true;
  const digits = q.replace(/^diables-?/, "");
  return /^\d+$/.test(digits) && Number(digits) === o.order_number;
}

export interface DebtOrder {
  member_id: string;
  /** Amount owed right now (see amountDueCents). */
  due_cents: number;
}

/** Member id → cents owed right now (sum of what is due on their orders). Members who owe nothing are omitted. */
export function debtByMember(orders: DebtOrder[]): Map<string, number> {
  const debt = new Map<string, number>();
  for (const o of orders) {
    if (o.due_cents <= 0) continue;
    debt.set(o.member_id, (debt.get(o.member_id) ?? 0) + o.due_cents);
  }
  return debt;
}

/** Total still to collect across all members. */
export function totalPending(orders: DebtOrder[]): number {
  let sum = 0;
  for (const cents of debtByMember(orders).values()) sum += cents;
  return sum;
}
