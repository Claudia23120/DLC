"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stack } from "@/components/ui/Layout";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { t } from "@/i18n/t";
import type { ShopAdminItem, ShopOrderView } from "@/lib/data/shop";
import type { AdminMemberItem } from "@/lib/data/members";
import { ShopOrdersAdmin } from "./ShopOrdersAdmin";
import { ShopCatalogAdmin } from "./ShopCatalogAdmin";
import { ShopRestockAdmin } from "./ShopRestockAdmin";
import { backorderedUnits } from "@/lib/domain/shop";

type Sub = "orders" | "restock" | "catalog";

/** Junta "Botiga" tab: orders (states, debts, reminders, CSV) and catalogue management. */
export function ShopTab({
  orders,
  items,
  members,
}: {
  orders: ShopOrderView[];
  items: ShopAdminItem[];
  members: AdminMemberItem[];
}) {
  const [sub, setSub] = usePersistedState<Sub>("junta-shop-sub", "orders");
  const pendingUnits = backorderedUnits(orders.flatMap((o) => o.lines));
  return (
    <Stack gap={14}>
      <SegmentedControl
        options={[
          { value: "orders", label: t.shopAdmin.subOrders },
          {
            value: "restock",
            label: `${t.shopAdmin.subRestock}${pendingUnits > 0 ? ` (${pendingUnits})` : ""}`,
          },
          { value: "catalog", label: t.shopAdmin.subCatalog },
        ]}
        value={sub}
        onChange={setSub}
      />
      {sub === "orders" ? (
        <ShopOrdersAdmin orders={orders} members={members} />
      ) : sub === "restock" ? (
        <ShopRestockAdmin orders={orders} items={items} />
      ) : (
        <ShopCatalogAdmin items={items} />
      )}
    </Stack>
  );
}
