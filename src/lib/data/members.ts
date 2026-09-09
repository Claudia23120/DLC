import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type DB = Awaited<ReturnType<typeof createClient>>;
export type MemberRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface MemberListItem {
  id: string;
  full_name: string;
  nickname: string | null;
  email: string;
  role_title: string | null;
  board_position: MemberRow["board_position"];
  member_roles: MemberRow["member_roles"];
}

export interface MemberWithPadrins extends MemberRow {
  padri_foc: { id: string; full_name: string } | null;
  padri_tabal: { id: string; full_name: string } | null;
}

export interface Fillol {
  id: string;
  full_name: string;
  nickname: string | null;
  role: "foc" | "tabal";
}

const LIST_COLUMNS = "id, full_name, nickname, email, role_title, board_position, member_roles";

/** All members, alphabetical. */
export async function listMembers(supabase: DB): Promise<MemberListItem[]> {
  const { data } = await supabase
    .from("profiles")
    .select(LIST_COLUMNS)
    .order("full_name", { ascending: true });
  return (data ?? []) as MemberListItem[];
}

/** The board (junta) members, for the "Junta directiva" list. */
export async function getBoard(supabase: DB): Promise<MemberListItem[]> {
  const { data } = await supabase
    .from("profiles")
    .select(LIST_COLUMNS)
    .not("board_position", "is", null)
    .order("full_name", { ascending: true });
  return (data ?? []) as MemberListItem[];
}

/** A single member's full profile, or null. */
export async function getMember(supabase: DB, id: string): Promise<MemberRow | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return data;
}

/** A single member's full profile including resolved padri names. */
export async function getMemberWithPadrins(
  supabase: DB,
  id: string,
): Promise<MemberWithPadrins | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*, padri_foc:padri_foc_id(id, full_name), padri_tabal:padri_tabal_id(id, full_name)")
    .eq("id", id)
    .single();
  if (!data) return null;
  return data as unknown as MemberWithPadrins;
}

/** Members who have chosen this member as their padri. */
export async function getFillols(supabase: DB, memberId: string): Promise<Fillol[]> {
  const [{ data: foc }, { data: tabal }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, nickname")
      .eq("padri_foc_id", memberId)
      .order("full_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, nickname")
      .eq("padri_tabal_id", memberId)
      .order("full_name", { ascending: true }),
  ]);

  const result: Fillol[] = [];
  for (const m of foc ?? []) result.push({ ...m, role: "foc" });
  for (const m of tabal ?? []) result.push({ ...m, role: "tabal" });
  return result;
}

const ADMIN_LIST_COLUMNS =
  "id, full_name, nickname, email, role_title, board_position, member_roles, member_status, joined_date";

export interface AdminMemberItem {
  id: string;
  full_name: string;
  nickname: string | null;
  email: string;
  role_title: string | null;
  board_position: MemberRow["board_position"];
  member_roles: MemberRow["member_roles"];
  member_status: MemberRow["member_status"];
  joined_date: string | null;
}

/** All members including inactive, with status — admin-only view. */
export async function listAllMembersForAdmin(supabase: DB): Promise<AdminMemberItem[]> {
  const { data } = await supabase
    .from("profiles")
    .select(ADMIN_LIST_COLUMNS)
    .order("full_name", { ascending: true });
  return (data ?? []) as AdminMemberItem[];
}

/** All members that have any padri set, for the Padrins tab. */
export interface LineageItem {
  id: string;
  full_name: string;
  nickname: string | null;
  padri_foc: { id: string; full_name: string } | null;
  padri_tabal: { id: string; full_name: string } | null;
}

export async function listMembersWithPadrins(supabase: DB): Promise<LineageItem[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, nickname, padri_foc:padri_foc_id(id, full_name), padri_tabal:padri_tabal_id(id, full_name)")
    .or("padri_foc_id.not.is.null,padri_tabal_id.not.is.null")
    .order("full_name", { ascending: true });
  return (data ?? []) as unknown as LineageItem[];
}
