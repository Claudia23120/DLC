"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/auth/session";
import type { BoardPosition, MemberStatus } from "@/types/database";

const MEMBER_STATUSES: MemberStatus[] = ["active", "inactive", "intermittent"];
const BOARD_POSITIONS: BoardPosition[] = [
  "presidenta",
  "vicepresidenta",
  "secretaria",
  "tresorera",
  "cap_de_foc",
  "cap_de_tabals",
];

/** Set a member's join date. Allowed for the member themselves and for admins. */
export async function saveJoinedDate(memberId: string, fd: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (user.id !== memberId) {
    const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!me?.is_admin) return;
  }

  const raw = String(fd.get("joined_date") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;

  // joined_date is a guarded column, so it is written with the service role.
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("profiles")
    .update({ joined_date: raw, joined_year: parseInt(raw.slice(0, 4), 10) })
    .eq("id", memberId);
  if (error) console.error("saveJoinedDate", error);
  revalidatePath(`/membres/${memberId}`);
}

/** Admin: status, board position, CRE/RGCRE and quota flags. */
export async function saveAdminFields(memberId: string, fd: FormData): Promise<void> {
  if (!(await getAdminContext())) return;

  const status = String(fd.get("member_status") ?? "") as MemberStatus;
  if (!MEMBER_STATUSES.includes(status)) return;
  const positionRaw = String(fd.get("board_position") ?? "").trim() as BoardPosition;
  const boardPosition = BOARD_POSITIONS.includes(positionRaw) ? positionRaw : null;

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("profiles")
    .update({
      member_status: status,
      board_position: boardPosition,
      has_cre: fd.get("has_cre") === "on",
      has_rgcre: fd.get("has_rgcre") === "on",
      quota_automatic: fd.get("quota_automatic") === "on",
    })
    .eq("id", memberId);
  if (error) console.error("saveAdminFields", error);

  revalidatePath(`/membres/${memberId}`);
  revalidatePath("/colla");
  revalidatePath("/junta");
}

/** Admin: save the paid/unpaid state of each listed quota year. */
export async function saveQuotaPayments(memberId: string, fd: FormData): Promise<void> {
  if (!(await getAdminContext())) return;

  const years = String(fd.get("years") ?? "")
    .split(",")
    .map(Number)
    .filter((y) => Number.isInteger(y) && y > 1900);
  if (!years.length) return;

  const admin = createServiceRoleClient();
  const { error } = await admin.from("quota_payments").upsert(
    years.map((year) => ({ member_id: memberId, year, paid: fd.get(`paid_${year}`) === "on" })),
    { onConflict: "member_id,year" },
  );
  if (error) console.error("saveQuotaPayments", error);
  revalidatePath(`/membres/${memberId}`);
}
