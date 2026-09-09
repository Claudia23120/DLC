import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requireProfile } from "@/lib/auth/session";
import { boardPositionLabel } from "@/lib/utils/labels";

/** Layout for all authenticated routes. Guards the session and renders the shell. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();

  return (
    <AppShell
      name={profile.full_name}
      roleLabel={boardPositionLabel(profile.board_position)}
      isAdmin={profile.is_admin}
    >
      {children}
    </AppShell>
  );
}
