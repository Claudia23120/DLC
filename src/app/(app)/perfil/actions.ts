"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/i18n/t";

export interface ProfileFormState {
  error?: string;
  ok?: boolean;
}

/**
 * Update the current member's own profile. Privileged columns (board position,
 * roles, counters) are protected by RLS + the guard trigger, so only editable
 * fields are sent here.
 */
export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.auth.genericError };

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };

  // Sizes and gear are JSON blobs assembled from the form.
  const sizes = {
    casaca: str("size_casaca"),
    pantalo: str("size_pantalo"),
    tabaler: str("size_tabaler"),
    own_suit_foc: formData.get("own_suit_foc") === "on",
    own_suit_tabaler: formData.get("own_suit_tabaler") === "on",
  };
  const gear = {
    guants: formData.get("gear_guants") === "on",
    ulleres: formData.get("gear_ulleres") === "on",
  };

  const padriFocId = str("padri_foc_id");
  const padriTabalId = str("padri_tabal_id");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: str("full_name") ?? "",
      nickname: str("nickname"),
      phone: str("phone"),
      emergency_contact: str("emergency_contact"),
      medical_notes: str("medical_notes"),
      bio: str("bio"),
      sizes,
      gear_needs: gear,
      padri_foc_id: padriFocId,
      padri_tabal_id: padriTabalId,
    })
    .eq("id", user.id);

  if (error) return { error: t.auth.genericError };

  revalidatePath("/perfil");
  return { ok: true };
}
