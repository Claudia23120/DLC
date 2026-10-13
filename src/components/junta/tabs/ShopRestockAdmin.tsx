"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Row, Stack } from "@/components/ui/Layout";
import { restockShopVariantAction } from "@/app/(app)/junta/shop-actions";
import { pendingRestock } from "@/lib/domain/shop";
import { t } from "@/i18n/t";
import type { ShopAdminItem, ShopOrderView } from "@/lib/data/shop";
import { ActionBtn, rowTitleStyle } from "./parts";

/** Units customers ordered without stock, per size: what to buy, and a way to book what arrives. */
export function ShopRestockAdmin({ orders, items }: { orders: ShopOrderView[]; items: ShopAdminItem[] }) {
  const [received, setReceived] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ error?: string; message?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const demand = pendingRestock(orders.flatMap((o) => o.lines));
    return items.flatMap((item) =>
      item.variants
        .filter((v) => demand.has(v.id))
        .map((v) => ({ variant: v, itemName: item.name, needed: demand.get(v.id) ?? 0 })),
    );
  }, [orders, items]);

  function book(variantId: string) {
    const quantity = Number(received[variantId]);
    startTransition(async () => {
      const r = await restockShopVariantAction(variantId, quantity);
      setBanner(r.error ? { error: r.error } : { message: r.message });
      if (r.ok) setReceived((m) => ({ ...m, [variantId]: "" }));
    });
  }

  return (
    <Stack gap={14}>
      <p style={{ fontSize: 14, margin: 0, opacity: 0.8 }}>{t.shopAdmin.restockIntro}</p>
      {banner?.error ? <div role="alert" style={{ color: "#dc2626", fontSize: 14 }}>{banner.error}</div> : null}
      {banner?.message ? <div role="status" style={{ color: "#16a34a", fontSize: 14 }}>{banner.message}</div> : null}

      {rows.length === 0 ? (
        <p className="text-muted">{t.shopAdmin.restockEmpty}</p>
      ) : (
        <div className="surface-card" style={{ overflow: "hidden" }}>
          {rows.map(({ variant, itemName, needed }) => (
            <div key={variant.id} className="admin-row" style={{ flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={rowTitleStyle}>{itemName} ({variant.size})</div>
                <div style={{ fontSize: 13, marginTop: 2 }}>
                  <strong>{t.shopAdmin.restockNeeded(needed)}</strong>
                  <span style={{ opacity: 0.6 }}> · {t.shopAdmin.restockFree(variant.stock)}</span>
                </div>
              </div>
              <Row gap={6} style={{ flex: "none" }}>
                <Input
                  aria-label={t.shopAdmin.restockQuantity}
                  placeholder={t.shopAdmin.restockQuantity}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={received[variant.id] ?? ""}
                  onChange={(e) => setReceived((m) => ({ ...m, [variant.id]: e.target.value }))}
                  style={{ height: 30, width: 130, fontSize: 12 }}
                />
                <ActionBtn disabled={pending || !received[variant.id]} onClick={() => book(variant.id)}>
                  {t.shopAdmin.restockReceived}
                </ActionBtn>
              </Row>
            </div>
          ))}
        </div>
      )}
    </Stack>
  );
}
