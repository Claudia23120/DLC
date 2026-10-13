"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext, getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { monthInputToDate } from "@/lib/domain/commissions";
import { listCommissions, type CommissionWithMembers } from "@/lib/data/commissions";
import { t } from "@/i18n/t";
import type { CommissionKind } from "@/types/database";

export interface CommissionActionResult {
  error?: string;
}

function revalidate() {
  revalidatePath("/bolos");
  revalidatePath("/junta");
}

/** Raised by guard_commission_join() (full / past commission) — already Catalan. */
function joinError(message: string): string {
  return /plena|acabat/.test(message) ? message : t.auth.genericError;
}

// ── Members ────────────────────────────────────────────────────────────────

/** A past (or the current) year's commissions with who was signed up. */
export async function getCommissionsAction(year: number): Promise<CommissionWithMembers[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.member_status === "inactive" || !Number.isInteger(year)) return [];
  return listCommissions(await createClient(), year);
}

export async function joinCommissionAction(commissionId: string): Promise<CommissionActionResult> {
  const profile = await getCurrentProfile();
  if (!profile || profile.member_status === "inactive") return { error: t.auth.genericError };
  const supabase = await createClient();

  const { error } = await supabase
    .from("commission_members")
    .insert({ commission_id: commissionId, member_id: profile.id, added_by: profile.id });

  if (error && error.code !== "23505") return { error: joinError(error.message) };
  revalidate();
  return {};
}

export async function leaveCommissionAction(commissionId: string): Promise<CommissionActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: t.auth.genericError };
  const supabase = await createClient();

  const { error } = await supabase
    .from("commission_members")
    .delete()
    .eq("commission_id", commissionId)
    .eq("member_id", profile.id);

  if (error) return { error: t.auth.genericError };
  revalidate();
  return {};
}

// ── Junta ──────────────────────────────────────────────────────────────────

function parseCommission(formData: FormData): { error: string } | {
  name: string;
  kind: CommissionKind;
  description: string | null;
  requirements: string | null;
  starts_on: string | null;
  ends_on: string | null;
  max_members: number | null;
} {
  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;

  const name = str("name");
  if (!name) return { error: t.commissions.nameRequired };

  const kind: CommissionKind = formData.get("kind") === "entitats" ? "entitats" : "propia";
  const allYear = formData.get("all_year") === "on";
  const starts_on = allYear ? null : monthInputToDate(String(formData.get("starts_on") ?? ""));
  const ends_on = allYear ? null : monthInputToDate(String(formData.get("ends_on") ?? ""));
  if (!allYear && (!starts_on || !ends_on)) return { error: t.commissions.periodRequired };
  if (starts_on && ends_on && ends_on < starts_on) return { error: t.commissions.periodInvalid };

  const max = Number(formData.get("max_members"));
  const max_members = Number.isInteger(max) && max > 0 ? max : null;

  return { name, kind, description: str("description"), requirements: str("requirements"), starts_on, ends_on, max_members };
}

export async function createCommissionAction(year: number, formData: FormData): Promise<CommissionActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };

  const fields = parseCommission(formData);
  if ("error" in fields) return fields;

  const { error } = await ctx.supabase
    .from("commissions")
    .insert({ ...fields, year, created_by: ctx.user.id });

  if (error) return { error: t.auth.genericError };
  revalidate();
  return {};
}

export async function updateCommissionAction(id: string, formData: FormData): Promise<CommissionActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };

  const fields = parseCommission(formData);
  if ("error" in fields) return fields;

  const { error } = await ctx.supabase.from("commissions").update(fields).eq("id", id);

  if (error) return { error: t.auth.genericError };
  revalidate();
  return {};
}

export async function deleteCommissionAction(id: string): Promise<void> {
  const ctx = await getAdminContext();
  if (!ctx) return;
  await ctx.supabase.from("commissions").delete().eq("id", id);
  revalidate();
}

/** Copy `fromYear`'s commissions (no members) into the following year. */
export async function duplicateCommissionsAction(fromYear: number): Promise<{ error?: string; count?: number }> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };

  const { data, error } = await ctx.supabase.rpc("duplicate_commissions", { p_from: fromYear, p_to: fromYear + 1 });

  // "Ja hi ha comissions per al …" is raised in Catalan by the function.
  if (error) return { error: error.message.startsWith("Ja hi ha") ? error.message : t.auth.genericError };
  revalidate();
  return { count: data ?? 0 };
}

export async function addCommissionMemberAction(commissionId: string, memberId: string): Promise<CommissionActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };

  const { error } = await ctx.supabase
    .from("commission_members")
    .insert({ commission_id: commissionId, member_id: memberId, added_by: ctx.user.id });

  if (error && error.code !== "23505") return { error: t.auth.genericError };
  revalidate();
  return {};
}

export async function removeCommissionMemberAction(commissionId: string, memberId: string): Promise<CommissionActionResult> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };

  const { error } = await ctx.supabase
    .from("commission_members")
    .delete()
    .eq("commission_id", commissionId)
    .eq("member_id", memberId);

  if (error) return { error: t.auth.genericError };
  revalidate();
  return {};
}
