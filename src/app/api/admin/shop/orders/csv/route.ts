import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/session";
import { listAllOrders } from "@/lib/data/shop";
import { backorderedUnits, formatEuros, orderReference } from "@/lib/domain/shop";
import { csvRow as row } from "@/lib/utils/csv";
import { t } from "@/i18n/t";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { supabase } = ctx;

  const [orders, { data: members }] = await Promise.all([
    listAllOrders(supabase),
    supabase.from("profiles").select("id, full_name, email"),
  ]);
  const byId = new Map((members ?? []).map((m) => [m.id, m]));

  const headers = [
    "Comanda", "Data", "Soci", "Correu", "Articles", "Total",
    "Entrega", "Data entrega", "Pagament", "Data pagament", "Mètode", "Unitats pendents de reposició", "Pagat", "A cobrar ara",
  ];

  const lines = [
    row(headers),
    ...orders.map((o) => {
      const m = byId.get(o.member_id);
      return row([
        orderReference(o.order_number),
        o.created_at.slice(0, 10),
        m?.full_name ?? "",
        m?.email ?? "",
        o.lines.map((l) => `${l.quantity} × ${l.itemName ?? "—"} (${l.size ?? "—"})`).join(" | "),
        formatEuros(o.total_cents),
        o.delivery_status === "delivered" ? t.shop.delivered : t.shop.deliveryPending,
        o.delivered_at?.slice(0, 10) ?? "",
        o.payment_status === "paid" ? t.shop.paid : t.shop.unpaid,
        o.paid_at?.slice(0, 10) ?? "",
        o.payment_method ? t.shop.paymentMethods[o.payment_method] : "",
        backorderedUnits(o.lines),
        formatEuros(o.paid_cents),
        formatEuros(o.due_cents),
      ]);
    }),
  ];

  const csv = "﻿" + lines.join("\r\n"); // BOM for Excel compatibility

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="botiga-comandes.csv"`,
    },
  });
}
