"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAdminContext } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { t } from "@/i18n/t";
import type { BoardPosition, MemberStatus } from "@/types/database";

export interface CreateMemberState {
  error?: string;
  ok?: boolean;
  /** Address the invitation was sent to. */
  email?: string;
}

/**
 * Admin: create a new member account (no public sign-up). Invites the member by
 * email (Supabase "Invite user" template): the link logs them in at
 * /auth/confirm and sends them to /reset-password to choose their own password.
 * Then fills in the rest of the profile.
 */
export async function createMemberAction(
  _prev: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  if (!(await getAdminContext())) return { error: t.auth.genericError };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const joinedDateRaw = String(formData.get("joined_date") ?? "").trim();
  const joinedDate = /^\d{4}-\d{2}-\d{2}$/.test(joinedDateRaw) ? joinedDateRaw : null;

  if (!fullName || !email) return { error: "Cal nom i correu." };

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

  // Prefer the configured site URL; the Origin header is client-controlled.
  const headersList = await headers();
  const origin = process.env.SITE_URL ?? headersList.get("origin") ?? "";

  // Create the auth user and email the invitation; the on_auth_user_created
  // trigger creates the profile row.
  const { data: created, error: createError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, nickname },
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
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
      board_position: boardPosition,
      joined_date: joinedDate,
      member_status: memberStatus,
      has_cre: hasCre,
      has_rgcre: hasRgcre,
    })
    .eq("id", created.user.id);

  revalidatePath("/colla");
  return { ok: true, email };
}
