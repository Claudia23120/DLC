"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/session";
import { madridDateTimeToISO } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { EventKind, MemberRole } from "@/types/database";
import type { EventRow } from "@/lib/data/events";

async function assertAdmin() {
  return (await getAdminContext())?.supabase ?? null;
}

/** Fetch a single event's full row (for the edit modal). */
export async function getEventAction(id: string): Promise<EventRow | null> {
  const supabase = await assertAdmin();
  if (!supabase) return null;
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  return data as EventRow | null;
}

export async function setCancelledAction(eventId: string, cancelled: boolean) {
  const supabase = await assertAdmin();
  if (!supabase) return;
  await supabase.from("events").update({ cancelled }).eq("id", eventId);
  revalidatePath("/junta");
  revalidatePath(`/bolos/${eventId}`);
}

export interface UpdateEventState { error?: string; ok?: boolean; }

export async function updateEventAction(
  _prev: UpdateEventState,
  formData: FormData,
): Promise<UpdateEventState> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: t.auth.genericError };

  const eventId = String(formData.get("event_id") ?? "");
  const kind = String(formData.get("kind") ?? "") as EventKind;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: t.create.titleRequired };

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;

  const update: Record<string, unknown> = { title };

  if (kind === "bolo") {
    update.starts_at = madridDateTimeToISO(date, time);
    update.location = str("location");
    update.organizer = str("organizer");
    update.description = str("description");
    update.map_url = str("map_url");
    update.ask_cars = formData.get("ask_cars") === "on";
    update.ask_sizes = formData.get("ask_sizes") === "on";
    update.allow_multiple_options = formData.get("allow_multiple_options") === "on";
    const roles = (["diable", "tabaler", "supporter"] as MemberRole[]).filter(
      (r) => formData.get(`role_${r}`) === "on",
    );
    update.allowed_roles = roles;
  } else if (kind === "event") {
    update.starts_at = madridDateTimeToISO(date, time);
    update.location = str("location");
    update.agenda = str("agenda");
    update.affects = str("affects");
    update.acta_url = str("acta_url");
  } else {
    const closes = str("closes_at");
    update.closes_at = closes ? new Date(closes).toISOString() : null;
    update.description = str("description");
    update.allow_multiple_votes = formData.get("allow_multiple_votes") === "on";
    update.secret_vote = formData.get("secret_vote") === "on";
  }

  const { error } = await supabase.from("events").update(update).eq("id", eventId);
  if (error) return { error: t.auth.genericError };

  revalidatePath("/junta");
  revalidatePath("/bolos");
  return { ok: true };
}

export async function deleteEventAction(eventId: string): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;
  await supabase.from("events").delete().eq("id", eventId);
  revalidatePath("/junta");
  revalidatePath("/bolos");
}

export async function createSongAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: t.auth.genericError };

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title || !slug) return { error: "Cal un títol i un identificador." };

  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const tempoRaw = formData.get("tempo");
  const tempo = tempoRaw && String(tempoRaw).trim() ? Number(tempoRaw) : null;

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("songs").insert({
    title,
    slug,
    kind: str("kind"),
    gp_url: str("gp_url"),
    tempo,
    notes: str("notes"),
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/musica");
  revalidatePath("/junta");
  return {};
}

export async function updateSongAction(id: string, formData: FormData): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: t.auth.genericError };

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title || !slug) return { error: "Cal un títol i un identificador." };

  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const tempoRaw = formData.get("tempo");
  const tempo = tempoRaw && String(tempoRaw).trim() ? Number(tempoRaw) : null;

  const { error } = await supabase.from("songs").update({
    title,
    slug,
    kind: str("kind"),
    gp_url: str("gp_url"),
    tempo,
    notes: str("notes"),
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/musica");
  revalidatePath(`/musica/${slug}`);
  revalidatePath("/junta");
  return {};
}

export async function deleteSongAction(id: string): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;
  await supabase.from("songs").delete().eq("id", id);
  revalidatePath("/musica");
  revalidatePath("/junta");
}

export async function setQuotaPaymentAction(
  memberId: string,
  year: number,
  installmentsPaid: number,
  installments: number,
): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;
  const done = Math.max(0, Math.min(installmentsPaid, installments));
  const { error } = await supabase.from("quota_payments").upsert(
    { member_id: memberId, year, paid: done >= installments, installments_paid: done },
    { onConflict: "member_id,year" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/junta");
}

/** Marks the n-th direct-debit collection for every billable domiciled member of a year. */
export async function markDomiciliationAction(year: number, n: number): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;
  if (n !== 1 && n !== 2) return;
  const { data: members, error: mErr } = await supabase
    .from("profiles")
    .select("id, joined_date, quota_installments")
    .eq("quota_automatic", true)
    .neq("member_status", "inactive");
  if (mErr) throw new Error(mErr.message);

  const rows = (members ?? [])
    .filter((m) => {
      const joined = m.joined_date ? parseInt(m.joined_date.slice(0, 4), 10) : null;
      return !(joined && joined > year) && m.quota_installments >= n;
    })
    .map((m) => ({
      member_id: m.id,
      year,
      paid: n >= m.quota_installments,
      installments_paid: n,
    }));
  if (!rows.length) return;
  const { error } = await supabase.from("quota_payments").upsert(rows, { onConflict: "member_id,year" });
  if (error) throw new Error(error.message);
  revalidatePath("/junta");
}
