"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Row, Stack } from "@/components/ui/Layout";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { PaymentDetails } from "./PaymentDetails";
import { placeOrderAction, type PlaceOrderResult } from "@/app/(app)/colla/botiga/actions";
import { MAX_LINE_QUANTITY, cartTotals, formatEuros, splitByStock } from "@/lib/domain/shop";
import { t } from "@/i18n/t";
import type { ShopCatalogItem, ShopPaymentInfo } from "@/lib/data/shop";

interface CartEntry {
  variantId: string;
  itemName: string;
  size: string;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  allowBackorder: boolean;
}

/** Most units that can go in the cart: unlimited by stock when the item allows backorders. */
function maxQuantity(c: Pick<CartEntry, "stock" | "allowBackorder">): number {
  return c.allowBackorder ? MAX_LINE_QUANTITY : Math.min(c.stock, MAX_LINE_QUANTITY);
}

type Confirmation = Extract<PlaceOrderResult, { ok: true }>;

/** Catalogue + simple cart + checkout, and the confirmation screen with transfer details. */
export function ShopCatalog({
  catalog,
  payment,
  onShowOrders,
}: {
  catalog: ShopCatalogItem[];
  payment: ShopPaymentInfo;
  onShowOrders: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({}); // item id → variant id
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  // Units beyond stock stay pending restock, and then the order can't count as already taken.
  const hasBackorder = cart.some((c) => splitByStock(c.quantity, c.stock).backordered > 0);

  // Only units in stock are paid now; units pending restock are paid once they arrive.
  const { dueNowCents, laterCents } = cartTotals(
    cart.map((c) => ({ quantity: c.quantity, stock: c.stock, unitPriceCents: c.unitPriceCents })),
  );

  const addToCart = (item: ShopCatalogItem) => {
    const variant = item.variants.find((v) => v.id === selected[item.id]);
    if (!variant) return;
    setError(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.variantId === variant.id);
      const cap = maxQuantity({ stock: variant.stock, allowBackorder: item.allow_backorder });
      if (existing) {
        return prev.map((c) => (c.variantId === variant.id ? { ...c, quantity: Math.min(c.quantity + 1, cap) } : c));
      }
      return [
        ...prev,
        { variantId: variant.id, itemName: item.name, size: variant.size, unitPriceCents: item.price_cents, quantity: 1, stock: variant.stock, allowBackorder: item.allow_backorder },
      ];
    });
  };

  const changeQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.variantId === variantId
            ? { ...c, quantity: Math.min(c.quantity + delta, maxQuantity(c)) }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const placeOrder = () => {
    setError(null);
    startTransition(async () => {
      const result = await placeOrderAction({
        lines: cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })),
        alreadyTaken: alreadyTaken && !hasBackorder,
      });
      if (!result.ok) {
        setError(result.error);
        router.refresh(); // stock may have changed
        return;
      }
      setConfirmation(result);
      setCart([]);
      setAlreadyTaken(false);
      router.refresh();
    });
  };

  if (confirmation) {
    return (
      <Stack gap={14}>
        <Card style={{ padding: 16, gap: 6 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>{t.shop.orderDone}</div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            {t.shop.orderNumber} {confirmation.reference}
          </div>
          {confirmation.backorderedUnits > 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-accent-700)" }}>
              {t.shop.unitsPending(confirmation.backorderedUnits)} — {t.shop.backorderPicked}
            </div>
          ) : null}
          <div style={{ fontSize: 13, opacity: 0.7 }}>{t.shop.emailSent}</div>
        </Card>
        {confirmation.dueCents > 0 ? (
          <PaymentDetails payment={payment} concept={confirmation.concept} amountCents={confirmation.dueCents} />
        ) : (
          <p style={{ fontSize: 14, margin: 0 }}>{t.shop.nothingToPayNow}</p>
        )}
        {confirmation.laterCents > 0 ? (
          <p style={{ fontSize: 13, margin: 0, opacity: 0.8 }}>{t.shop.payLaterNote(formatEuros(confirmation.laterCents))}</p>
        ) : null}
        <Row gap={8}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1, height: 44 }} onClick={() => setConfirmation(null)}>
            {t.shop.newOrder}
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 1, height: 44 }} onClick={onShowOrders}>
            {t.shop.viewOrders}
          </button>
        </Row>
      </Stack>
    );
  }

  if (catalog.length === 0) return <p className="text-muted">{t.shop.catalogEmpty}</p>;

  return (
    <Stack gap={16}>
      {catalog.map((item) => {
        const chosen = item.variants.find((v) => v.id === selected[item.id]);
        return (
          <Card key={item.id} style={{ padding: 16, gap: 10 }}>
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 16 }}
              />
            ) : null}
            <Row justify="between" gap={8} align="start">
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>{item.name}</div>
              <strong style={{ fontSize: 16, flex: "none" }}>{formatEuros(item.price_cents)}</strong>
            </Row>
            {item.description ? <p style={{ fontSize: 14, margin: 0, opacity: 0.8 }}>{item.description}</p> : null}

            <div>
              <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.6, marginBottom: 6 }}>
                {t.shop.size}
              </div>
              <div className="chip-row" style={{ flexWrap: "wrap" }}>
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="chip"
                    aria-pressed={selected[item.id] === v.id}
                    disabled={v.stock <= 0 && !item.allow_backorder}
                    title={v.stock <= 0 ? (item.allow_backorder ? t.shop.backorderChip : t.shop.outOfStock) : undefined}
                    onClick={() => setSelected((s) => ({ ...s, [item.id]: v.id }))}
                    style={
                      v.stock <= 0
                        ? item.allow_backorder
                          ? { opacity: 0.7, fontStyle: "italic" }
                          : { opacity: 0.4, textDecoration: "line-through" }
                        : undefined
                    }
                  >
                    {v.size}
                  </button>
                ))}
              </div>
              {chosen && chosen.stock <= 0 && item.allow_backorder ? (
                <div style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 6 }}>{t.shop.backorderPicked}</div>
              ) : chosen && chosen.stock > 0 && chosen.stock <= 5 ? (
                <div style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 6 }}>{t.shop.onlyLeft(chosen.stock)}</div>
              ) : null}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ height: 44 }}
              disabled={!chosen}
              onClick={() => addToCart(item)}
            >
              {chosen ? t.shop.addToCart : t.shop.pickSize}
            </button>
          </Card>
        );
      })}

      <section>
        <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.shop.cart}</h3>
        {cart.length === 0 ? (
          <p className="text-muted" style={{ margin: 0 }}>{t.shop.cartEmpty}</p>
        ) : (
          <Card style={{ padding: 16, gap: 12 }}>
            {cart.map((c) => (
              <Row key={c.variantId} gap={8}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
                  <div className="break-anywhere">{c.itemName} ({c.size})</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{formatEuros(c.unitPriceCents)}</div>
                  {splitByStock(c.quantity, c.stock).backordered > 0 ? (
                    <div style={{ fontSize: 12, color: "var(--color-accent-700)" }}>
                      {t.shop.backorderPartial(splitByStock(c.quantity, c.stock).backordered)}
                    </div>
                  ) : null}
                </div>
                <button type="button" className="btn btn-icon" aria-label={t.shop.remove} onClick={() => changeQuantity(c.variantId, -1)}>−</button>
                <strong style={{ minWidth: 20, textAlign: "center" }}>{c.quantity}</strong>
                <button
                  type="button"
                  className="btn btn-icon"
                  aria-label={t.shop.addToCart}
                  disabled={c.quantity >= maxQuantity(c)}
                  onClick={() => changeQuantity(c.variantId, 1)}
                >
                  +
                </button>
              </Row>
            ))}

            <Stack gap={4} style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 10 }}>
              <Row justify="between">
                <span>{laterCents > 0 ? t.shop.dueNow : t.shop.total}</span>
                <strong style={{ fontSize: 18 }}>{formatEuros(dueNowCents)}</strong>
              </Row>
              {laterCents > 0 ? (
                <Row justify="between" style={{ fontSize: 13, opacity: 0.75 }}>
                  <span>{t.shop.laterAmount}</span>
                  <span>{formatEuros(laterCents)}</span>
                </Row>
              ) : null}
            </Stack>

            {hasBackorder ? (
              <p style={{ fontSize: 13, margin: 0, opacity: 0.8 }}>{t.shop.backorderNoTake}</p>
            ) : (
              <ToggleRow label={t.shop.alreadyTaken} checked={alreadyTaken} onChange={setAlreadyTaken} name="already_taken" />
            )}

            {error ? <div role="alert" style={{ color: "#dc2626", fontSize: 14 }}>{error}</div> : null}

            <button type="button" className="btn btn-primary" style={{ height: 48 }} disabled={pending} onClick={placeOrder}>
              {pending ? t.shop.placingOrder : t.shop.placeOrder}
            </button>
          </Card>
        )}
      </section>
    </Stack>
  );
}
