import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

function escapeCSV(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(values: unknown[]): string {
  return values.map(escapeCSV).join(",");
}

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
