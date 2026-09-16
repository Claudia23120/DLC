import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requireProfile } from "@/lib/auth/session";

/** Layout for all authenticated routes. Guards the session and renders the shell. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();

  return (
    <AppShell
      name={profile.full_name}
      isAdmin={profile.is_admin}
    >
      {children}
    </AppShell>
  );
}
