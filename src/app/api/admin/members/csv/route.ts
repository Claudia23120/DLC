import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/session";
import { csvRow as row } from "@/lib/utils/csv";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { supabase } = ctx;

  const { data: members } = await supabase
    .from("profiles")
    .select("full_name, nickname, email, phone, member_status, has_cre, has_rgcre, quota_automatic, joined_date, bolo_count, foc_count, tabal_count")
    .order("full_name", { ascending: true });

  const headers = [
    "Nom", "Mote", "Correu", "Mòbil",
    "Estat", "CRE", "RGCRE", "Quota domiciliada",
    "Data d'entrada",
    "Bolos", "Foc", "Tabals",
  ];

  const statusLabel: Record<string, string> = {
    active: "Actiu/a",
    inactive: "Inactiu/a",
    intermittent: "Intermitent",
  };

  const lines = [
    row(headers),
    ...(members ?? []).map((m) =>
      row([
        m.full_name,
        m.nickname ?? "",
        m.email,
        m.phone ?? "",
        statusLabel[m.member_status] ?? m.member_status,
        m.has_cre ? "Sí" : "No",
        m.has_rgcre ? "Sí" : "No",
        m.quota_automatic ? "Sí" : "No",
        m.joined_date ?? "",
        m.bolo_count,
        m.foc_count,
        m.tabal_count,
      ])
    ),
  ];

  const csv = "﻿" + lines.join("\r\n"); // BOM for Excel compatibility

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="membres-diables.csv"`,
    },
  });
}
