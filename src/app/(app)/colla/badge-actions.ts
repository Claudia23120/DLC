"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/session";
import { t } from "@/i18n/t";
import type { BadgeType } from "@/types/database";

export interface CreateBadgeState {
  error?: string;
  ok?: boolean;
}

export async function createBadgeAction(
  _prev: CreateBadgeState,
  formData: FormData,
): Promise<CreateBadgeState> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: t.auth.genericError };
  const { supabase } = ctx;

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const icon = String(formData.get("icon") ?? "🏅").trim() || "🏅";
  const type = String(formData.get("type") ?? "manual") as BadgeType;
  const reptePattern = String(formData.get("repte_pattern") ?? "").trim() || null;
  const slug = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  if (!name) return { error: "Cal un nom per a la insígnia." };

  const { error } = await supabase.from("badge_definitions").insert({
    slug: `${slug}_${Date.now()}`,
    name,
    description,
    icon,
    type,
    repte_pattern: type === "repte" ? reptePattern : null,
  });

  if (error) return { error: t.auth.genericError };

  revalidatePath("/colla");
  return { ok: true };
}

export async function grantBadgeAction(memberId: string, badgeId: string): Promise<void> {
  const ctx = await getAdminContext();
  if (!ctx) return;
  const { supabase, user } = ctx;

  await supabase.from("member_badges").insert({
    member_id: memberId,
    badge_id: badgeId,
    granted_by: user.id,
  });

  revalidatePath(`/membres/${memberId}`);
}

export async function revokeBadgeAction(memberId: string, badgeId: string): Promise<void> {
  const ctx = await getAdminContext();
  if (!ctx) return;
  const { supabase } = ctx;

  await supabase
    .from("member_badges")
    .delete()
    .eq("member_id", memberId)
    .eq("badge_id", badgeId);

  revalidatePath(`/membres/${memberId}`);
}
