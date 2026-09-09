"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { t } from "@/i18n/t";
import type { BoardPosition, MemberRole, MemberStatus } from "@/types/database";

export interface CreateMemberState {
  error?: string;
  ok?: boolean;
  tempPassword?: string;
}

/** A readable temporary password for the new member. */
function generateTempPassword(): string {
  return "Dlc-" + crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

/**
 * Admin: create a new member account (no public sign-up). Creates the Supabase
 * Auth user with a temporary password, then fills in the profile. Returns the
 * temp password so the admin can pass it to the member.
 */
export async function createMemberAction(
  _prev: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.auth.genericError };

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return { error: t.auth.genericError };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const joinedDateRaw = String(formData.get("joined_date") ?? "").trim();
  const joinedDate = /^\d{4}-\d{2}-\d{2}$/.test(joinedDateRaw) ? joinedDateRaw : null;
  const joinedYear = joinedDate ? parseInt(joinedDate.slice(0, 4), 10) : null;

  if (!fullName || !email) return { error: "Cal nom i correu." };

  const roles = (["diable", "tabaler", "supporter"] as MemberRole[]).filter(
    (r) => formData.get(`role_${r}`) === "on",
  );
  const boardPositionRaw = String(formData.get("board_position") ?? "").trim();
  const boardPosition = (boardPositionRaw || null) as BoardPosition | null;
  const memberStatusRaw = String(formData.get("member_status") ?? "active").trim();
  const validStatuses: MemberStatus[] = ["active", "inactive", "intermittent"];
  const memberStatus: MemberStatus = validStatuses.includes(memberStatusRaw as MemberStatus)
    ? (memberStatusRaw as MemberStatus)
    : "active";
  const hasCre = formData.get("has_cre") === "on";
  const hasRgcre = formData.get("has_rgcre") === "on";

  const admin = createServiceRoleClient();
  const tempPassword = generateTempPassword();

  // Create the auth user; the on_auth_user_created trigger creates the profile.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, nickname },
  });

  if (createError || !created.user) {
    const msg = createError?.message?.includes("already")
      ? "Ja existeix un membre amb aquest correu."
      : t.auth.genericError;
    return { error: msg };
  }

  // Fill in the rest of the profile (service role bypasses RLS + guard).
  await admin
    .from("profiles")
    .update({
      full_name: fullName,
      nickname,
      phone,
      member_roles: roles.length ? roles : ["diable"],
      board_position: boardPosition,
      joined_date: joinedDate,
      joined_year: joinedYear,
      member_status: memberStatus,
      has_cre: hasCre,
      has_rgcre: hasRgcre,
    })
    .eq("id", created.user.id);

  revalidatePath("/colla");
  return { ok: true, tempPassword };
}
