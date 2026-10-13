"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Row, Stack } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";
import { usePagination } from "@/lib/hooks/usePagination";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import {
  setOrderDeliveryAction,
  setOrderPaymentAction,
  sendShopRemindersAction,
  type ShopActionResult,
} from "@/app/(app)/junta/shop-actions";
import {
  backorderedUnits,
  canMarkDelivered,
  debtByMember,
  formatEuros,
  matchesOrderFilter,
  matchesOrderSearch,
  orderReference,
  totalPending,
  type OrderFilter,
} from "@/lib/domain/shop";
import { formatShortDate } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { ShopOrderView } from "@/lib/data/shop";
import type { AdminMemberItem } from "@/lib/data/members";
import type { ShopPaymentMethod } from "@/types/database";
import { ActionBtn, StatusPill, rowTitleStyle } from "./parts";

const METHODS: ShopPaymentMethod[] = ["transfer", "cash", "other"];
const GREEN = { color: "#16a34a", bg: "rgba(34,197,94,.12)" };
const RED = { color: "#dc2626", bg: "rgba(220,38,38,.1)" };
const MUTED = { color: "rgba(32,30,29,.55)", bg: "rgba(32,30,29,.07)" };

export function ShopOrdersAdmin({ orders, members }: { orders: ShopOrderView[]; members: AdminMemberItem[] }) {
  const [filter, setFilter] = usePersistedState<OrderFilter>("junta-shop-filter", "to_collect");
  const [search, setSearch] = useState("");
  const [methods, setMethods] = useState<Record<string, ShopPaymentMethod>>({});
  const [banner, setBanner] = useState<{ error?: string; message?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const nameOf = (id: string) => memberById.get(id)?.full_name ?? "—";

  const searched = orders.filter((o) => {
    const m = memberById.get(o.member_id);
    return matchesOrderSearch(
      { order_number: o.order_number, memberName: m?.full_name ?? "", memberNickname: m?.nickname },
      search,
    );
  });
  const visible = searched.filter((o) => matchesOrderFilter(o, filter));
  const pag = usePagination(visible, 20, `${filter}|${search}`);

  const FILTERS: { key: OrderFilter; label: string }[] = [
    { key: "all", label: t.shopAdmin.filterAll },
    { key: "to_deliver", label: t.shopAdmin.filterToDeliver },
    { key: "to_collect", label: t.shopAdmin.filterToCollect },
    { key: "closed", label: t.shopAdmin.filterClosed },
  ];

  const debts = [...debtByMember(orders).entries()].sort((a, b) => b[1] - a[1]);

  function run(fn: () => Promise<ShopActionResult>) {
    startTransition(async () => {
      const r = await fn();
      setBanner(r.error ? { error: r.error } : r.message ? { message: r.message } : null);
    });
  }

  function remind(memberId: string | null, label: string) {
    const text = memberId ? t.shopAdmin.reminderConfirm(label) : t.shopAdmin.reminderAllConfirm(debts.length);
    if (!window.confirm(text)) return;
    run(() => sendShopRemindersAction(memberId));
  }

  return (
    <Stack gap={14}>
      {/* Pending total + debt per member */}
      <Card style={{ padding: 16, gap: 10 }}>
        <Row justify="between" gap={8} wrap>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.6 }}>
              {t.shopAdmin.pendingToCollect}
            </div>
            <strong style={{ fontSize: 22 }}>{formatEuros(totalPending(orders))}</strong>
          </div>
          <Row gap={8} wrap>
            {debts.length > 0 ? (
              <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={() => remind(null, "")}>
                {t.shopAdmin.sendReminderAll}
              </button>
            ) : null}
            <a href="/api/admin/shop/orders/csv" download className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center" }}>
              {t.shopAdmin.exportCsv}
            </a>
          </Row>
        </Row>

        <div style={{ fontSize: 12, opacity: 0.6 }}>{t.shopAdmin.owedByMember}</div>
        {debts.length === 0 ? (
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>{t.shopAdmin.nobodyOwes}</p>
        ) : (
          <Stack gap={6}>
            {debts.map(([memberId, cents]) => (
              <Row key={memberId} gap={8}>
                <span className="break-anywhere" style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{nameOf(memberId)}</span>
                <strong style={{ fontSize: 14 }}>{formatEuros(cents)}</strong>
                <ActionBtn disabled={pending} onClick={() => remind(memberId, nameOf(memberId))}>
                  {t.shopAdmin.sendReminder}
                </ActionBtn>
              </Row>
            ))}
          </Stack>
        )}
      </Card>

      {banner?.error ? <div role="alert" style={{ color: "#dc2626", fontSize: 14 }}>{banner.error}</div> : null}
      {banner?.message ? <div role="status" style={{ color: "#16a34a", fontSize: 14 }}>{banner.message}</div> : null}

      {/* Filters + search */}
      <div className="chip-row">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
            <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.65 }}>
              {searched.filter((o) => matchesOrderFilter(o, f.key)).length}
            </span>
          </button>
        ))}
      </div>
      <Input
        placeholder={t.shopAdmin.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ height: 44 }}
      />

      {/* Orders */}
      {visible.length === 0 ? (
        <p className="text-muted">{t.shopAdmin.noOrders}</p>
      ) : (
        <div className="surface-card" style={{ overflow: "hidden" }}>
          {pag.pageItems.map((o) => {
            const method = methods[o.id] ?? "transfer";
            return (
              <div key={o.id} className="admin-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={rowTitleStyle}>
                    {orderReference(o.order_number)} · {nameOf(o.member_id)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.55, margin: "2px 0 4px" }}>{formatShortDate(o.created_at)}</div>
                  {o.lines.map((l) => (
                    <div key={l.id} style={{ fontSize: 13 }}>
                      {l.quantity} × {l.itemName ?? t.shop.unavailableItem}
                      {l.size ? ` (${l.size})` : ""}
                      {l.backorderedQuantity > 0 ? (
                        <span style={{ color: RED.color, fontSize: 12 }}> · {t.shop.unitsPending(l.backorderedQuantity)}</span>
                      ) : null}
                    </div>
                  ))}
                  <Row gap={6} wrap style={{ marginTop: 6 }}>
                    <StatusPill
                      label={o.delivery_status === "delivered" ? t.shop.delivered : t.shop.deliveryPending}
                      {...(o.delivery_status === "delivered" ? GREEN : MUTED)}
                    />
                    {backorderedUnits(o.lines) > 0 ? <StatusPill label={t.shopAdmin.awaitingRestock} {...RED} /> : null}
                    <StatusPill
                      label={
                        o.payment_status === "paid"
                          ? t.shop.paid
                          : o.paid_cents > 0 && o.due_cents === 0
                            ? t.shop.paidSoFar
                            : t.shop.unpaid
                      }
                      {...(o.payment_status === "paid" || (o.paid_cents > 0 && o.due_cents === 0)
                        ? GREEN
                        : o.due_cents === 0 && o.total_cents > 0
                          ? MUTED
                          : RED)}
                    />
                  </Row>
                  {o.paid_at && o.payment_method ? (
                    <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>
                      {t.shop.paidOn(formatShortDate(o.paid_at), t.shop.paymentMethods[o.payment_method])}
                    </div>
                  ) : null}
                  {o.delivered_at ? (
                    <div style={{ fontSize: 12, opacity: 0.55 }}>{t.shop.deliveredOn(formatShortDate(o.delivered_at))}</div>
                  ) : null}
                </div>

                <Stack gap={6} style={{ flex: "none", alignItems: "flex-end" }}>
                  <strong style={{ fontSize: 15 }}>{formatEuros(o.total_cents)}</strong>
                  {o.pending_cents > 0 ? (
                    <div style={{ fontSize: 11, opacity: 0.7, textAlign: "right" }}>
                      <div>{t.shopAdmin.dueNowLabel}: {formatEuros(o.due_cents)}</div>
                      <div>{t.shopAdmin.laterLabel}: {formatEuros(o.pending_cents)}</div>
                    </div>
                  ) : null}

                  {o.payment_status === "unpaid" ? (
                    o.due_cents > 0 || o.total_cents === 0 ? (
                      <Row gap={6}>
                        <select
                          className="input"
                          aria-label={t.shopAdmin.paymentMethod}
                          value={method}
                          onChange={(e) => setMethods((m) => ({ ...m, [o.id]: e.target.value as ShopPaymentMethod }))}
                          style={{ height: 30, fontSize: 12, padding: "0 8px", width: "auto" }}
                        >
                          {METHODS.map((m) => (
                            <option key={m} value={m}>{t.shop.paymentMethods[m]}</option>
                          ))}
                        </select>
                        <ActionBtn disabled={pending} onClick={() => run(() => setOrderPaymentAction(o.id, true, method))}>
                          {t.shopAdmin.markPaid}
                        </ActionBtn>
                      </Row>
                    ) : (
                      <span style={{ fontSize: 12, opacity: 0.6, textAlign: "right" }}>{t.shopAdmin.nothingToCollect}</span>
                    )
                  ) : null}
                  {o.paid_cents > 0 ? (
                    <ActionBtn disabled={pending} onClick={() => run(() => setOrderPaymentAction(o.id, false))}>
                      {t.shopAdmin.markUnpaid}
                    </ActionBtn>
                  ) : null}

                  {o.delivery_status === "pending" ? (
                    <ActionBtn
                      disabled={pending || !canMarkDelivered(o.lines)}
                      onClick={() => run(() => setOrderDeliveryAction(o.id, true))}
                    >
                      {t.shopAdmin.markDelivered}
                    </ActionBtn>
                  ) : (
                    <ActionBtn disabled={pending} onClick={() => run(() => setOrderDeliveryAction(o.id, false))}>
                      {t.shopAdmin.markPending}
                    </ActionBtn>
                  )}
                </Stack>
              </div>
            );
          })}
        </div>
      )}
      <Pagination {...pag} onPrev={pag.prev} onNext={pag.next} />
    </Stack>
  );
}
