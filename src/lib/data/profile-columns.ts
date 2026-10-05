import type { Database } from "@/types/database";

/** A profile row as members can read it: `nif` and `emergency_contact` are
 *  column-protected in the database (see migration 0022). */
export type ProfileRow = Omit<
  Database["public"]["Tables"]["profiles"]["Row"],
  "nif" | "emergency_contact"
>;

/**
 * Every readable column of `profiles`. Use this instead of `select("*")`,
 * which Postgres rejects because of the column-level privileges.
 */
export const PROFILE_COLUMNS =
  "id, full_name, nickname, email, phone, birth_date, medical_notes, bio, board_position, is_admin, joined_date, sizes, gear_needs, bolo_count, foc_count, tabal_count, padri_foc_id, padri_tabal_id, member_status, inactive_since, has_cre, has_rgcre, quota_automatic, avatar_url, created_at, updated_at" as const;
