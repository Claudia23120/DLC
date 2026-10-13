import "server-only";
import type { Database } from "@/types/database";
import type { createClient } from "@/lib/supabase/server";
import { collaContent } from "@/content/colla";
import { amountDueCents, compareSizes, pendingCents } from "@/lib/domain/shop";

type DB = Awaited<ReturnType<typeof createClient>>;

export type ShopOrderRow = Database["public"]["Tables"]["shop_orders"]["Row"];

export interface ShopVariant {
  id: string;
  size: string;
  stock: number;
}

export interface ShopCatalogItem {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  /** Accepts orders beyond stock (the rest is "pendent de reposició"). */
  allow_backorder: boolean;
  variants: ShopVariant[];
}

export interface ShopOrderLineView {
  id: string;
  variantId: string;
  quantity: number;
  /** Units of this line still waiting for stock. */
  backorderedQuantity: number;
  unit_price_cents: number;
  /** null when the item is no longer visible (should not happen for own orders). */
  itemName: string | null;
  size: string | null;
}

export interface ShopOrderView extends ShopOrderRow {
  lines: ShopOrderLineView[];
  /** Owed right now: units covered by stock, minus what was already paid. */
  due_cents: number;
  /** Value of the units still pending restock (paid once they arrive). */
  pending_cents: number;
}

/** Bank details shown to members. */
export interface ShopPaymentInfo {
  iban: string;
}

/** Transfer details for botiga orders: the club IBAN published in "La colla" (the quota account). */
export function getShopPaymentInfo(): ShopPaymentInfo {
  return { iban: collaContent.fee.iban };
}

/** Raw nested shapes returned by PostgREST (our hand-written types declare no relationships). */
interface RawItem extends Omit<ShopCatalogItem, "variants"> {
  shop_item_variants: ShopVariant[] | null;
}
interface RawLine {
  id: string;
  variant_id: string;
  backordered_quantity: number;
  quantity: number;
  unit_price_cents: number;
  shop_item_variants: { size: string; shop_items: { name: string } | null } | null;
}
interface RawOrder extends ShopOrderRow {
  shop_order_lines: RawLine[] | null;
}

const ORDER_SELECT =
  "*, shop_order_lines(id, variant_id, quantity, backordered_quantity, unit_price_cents, shop_item_variants(size, shop_items(name)))";

function toOrderView(raw: RawOrder): ShopOrderView {
  const { shop_order_lines, ...order } = raw;
  const lines = (shop_order_lines ?? []).map((l) => ({
    id: l.id,
    variantId: l.variant_id,
    quantity: l.quantity,
    backorderedQuantity: l.backordered_quantity,
    unit_price_cents: l.unit_price_cents,
    itemName: l.shop_item_variants?.shop_items?.name ?? null,
    size: l.shop_item_variants?.size ?? null,
  }));
  const priced = lines.map((l) => ({
    quantity: l.quantity,
    backorderedQuantity: l.backorderedQuantity,
    unitPriceCents: l.unit_price_cents,
  }));
  return {
    ...order,
    lines,
    due_cents: amountDueCents(priced, order.paid_cents),
    pending_cents: pendingCents(priced),
  };
}

/** Active items with their variants (sizes sorted). RLS also exposes inactive items the member once ordered, so filter explicitly. */
export async function listCatalog(supabase: DB): Promise<ShopCatalogItem[]> {
  const { data } = await supabase
    .from("shop_items")
    .select("id, name, description, price_cents, image_url, allow_backorder, shop_item_variants(id, size, stock)")
    .eq("active", true)
    .order("name");

  return ((data ?? []) as unknown as RawItem[]).map(({ shop_item_variants, ...item }) => ({
    ...item,
    variants: [...(shop_item_variants ?? [])].sort((a, b) => compareSizes(a.size, b.size)),
  }));
}

/** The member's own orders, newest first. Filtered by member even though RLS would also allow admins to see everything. */
export async function listMyOrders(supabase: DB, memberId: string): Promise<ShopOrderView[]> {
  const { data } = await supabase
    .from("shop_orders")
    .select(ORDER_SELECT)
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as RawOrder[]).map(toOrderView);
}

export async function getOrder(supabase: DB, orderId: string): Promise<ShopOrderView | null> {
  const { data } = await supabase.from("shop_orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle();
  return data ? toOrderView(data as unknown as RawOrder) : null;
}

/** Catalogue item as the board sees it (includes inactive items). */
export interface ShopAdminItem extends ShopCatalogItem {
  active: boolean;
}

/** Every order (board only — RLS lets admins read all), newest first. */
export async function listAllOrders(supabase: DB): Promise<ShopOrderView[]> {
  const { data } = await supabase
    .from("shop_orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as RawOrder[]).map(toOrderView);
}

/** Whole catalogue including inactive items, for the board's editor. */
export async function listCatalogAdmin(supabase: DB): Promise<ShopAdminItem[]> {
  const { data } = await supabase
    .from("shop_items")
    .select("id, name, description, price_cents, image_url, allow_backorder, active, shop_item_variants(id, size, stock)")
    .order("name");

  return ((data ?? []) as unknown as (RawItem & { active: boolean })[]).map(({ shop_item_variants, ...item }) => ({
    ...item,
    variants: [...(shop_item_variants ?? [])].sort((a, b) => compareSizes(a.size, b.size)),
  }));
}
