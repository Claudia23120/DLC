import { Card } from "@/components/ui/Card";
import { Row, Stack } from "@/components/ui/Layout";
import { Tag } from "@/components/ui/Tag";
import { PaymentDetails } from "./PaymentDetails";
import { backorderedUnits, formatEuros, orderReference, transferConcept } from "@/lib/domain/shop";
import { formatShortDate } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { ShopOrderView, ShopPaymentInfo } from "@/lib/data/shop";

/** The member's own orders with delivery/payment state; transfer details stay visible while unpaid. */
export function ShopOrders({
  orders,
  payment,
  memberName,
}: {
  orders: ShopOrderView[];
  payment: ShopPaymentInfo;
  memberName: string;
}) {
  if (orders.length === 0) return <p className="text-muted">{t.shop.ordersEmpty}</p>;

  return (
    <Stack gap={12}>
      {orders.map((o) => (
        <Card key={o.id} style={{ padding: 16, gap: 10 }}>
          <Row justify="between" gap={8}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{orderReference(o.order_number)}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{formatShortDate(o.created_at)}</div>
            </div>
            <strong style={{ fontSize: 16 }}>{formatEuros(o.total_cents)}</strong>
          </Row>
          {o.pending_cents > 0 ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {t.shop.dueNow}: {formatEuros(o.due_cents)} · {t.shop.laterAmount}: {formatEuros(o.pending_cents)}
            </div>
          ) : null}

          <Stack gap={2}>
            {o.lines.map((l) => (
              <div key={l.id} style={{ fontSize: 14 }}>
                {l.quantity} × {l.itemName ?? t.shop.unavailableItem}
                {l.size ? ` (${l.size})` : ""}
                {l.backorderedQuantity > 0 ? (
                  <span style={{ color: "var(--color-accent-700)", fontSize: 12 }}> · {t.shop.unitsPending(l.backorderedQuantity)}</span>
                ) : null}
              </div>
            ))}
          </Stack>

          <Row gap={6} wrap>
            <Tag variant={o.delivery_status === "delivered" ? "neutral" : "outline"}>
              {o.delivery_status === "delivered" ? t.shop.delivered : t.shop.deliveryPending}
            </Tag>
            {backorderedUnits(o.lines) > 0 && !(o.paid_cents === 0 && o.due_cents === 0) ? (
              <Tag variant="accent">{t.shop.awaitingRestock}</Tag>
            ) : null}
            <Tag variant={o.payment_status === "paid" || (o.paid_cents > 0 && o.due_cents === 0) ? "neutral" : "accent"}>
              {o.payment_status === "paid"
                ? t.shop.paid
                : o.paid_cents > 0 && o.due_cents === 0
                  ? t.shop.paidSoFar
                  : o.due_cents === 0
                    ? t.shop.awaitingRestock
                    : t.shop.unpaid}
            </Tag>
          </Row>

          {o.delivered_at ? (
            <div style={{ fontSize: 12, opacity: 0.6 }}>{t.shop.deliveredOn(formatShortDate(o.delivered_at))}</div>
          ) : null}
          {o.paid_at && o.payment_method ? (
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {t.shop.paidOn(formatShortDate(o.paid_at), t.shop.paymentMethods[o.payment_method])}
            </div>
          ) : null}

          {o.due_cents > 0 ? (
            <PaymentDetails
              payment={payment}
              concept={transferConcept(o.order_number, memberName)}
              amountCents={o.due_cents}
            />
          ) : null}
        </Card>
      ))}
    </Stack>
  );
}
