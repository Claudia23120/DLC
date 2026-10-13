"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stack } from "@/components/ui/Layout";
import { ShopCatalog } from "./ShopCatalog";
import { ShopOrders } from "./ShopOrders";
import { t } from "@/i18n/t";
import type { ShopCatalogItem, ShopOrderView, ShopPaymentInfo } from "@/lib/data/shop";

type Tab = "catalog" | "orders";

/** Member-facing shop: catalogue + cart, and "Les meves comandes". */
export function ShopView({
  catalog,
  orders,
  payment,
  memberName,
}: {
  catalog: ShopCatalogItem[];
  orders: ShopOrderView[];
  payment: ShopPaymentInfo;
  memberName: string;
}) {
  const [tab, setTab] = useState<Tab>("catalog");

  return (
    <Stack gap={16}>
      <SegmentedControl
        options={[
          { value: "catalog", label: t.shop.tabCatalog },
          { value: "orders", label: t.shop.tabOrders },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "catalog" ? (
        <ShopCatalog catalog={catalog} payment={payment} onShowOrders={() => setTab("orders")} />
      ) : (
        <ShopOrders orders={orders} payment={payment} memberName={memberName} />
      )}
    </Stack>
  );
}
