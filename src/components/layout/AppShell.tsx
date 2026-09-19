import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { BottomTabBar } from "./BottomTabBar";

interface AppShellProps {
  name: string;
  isAdmin: boolean;
  children: ReactNode;
}

/**
 * App frame: desktop top nav / mobile bottom tabs with a scrollable content
 * region in between. The per-page header lives inside each page.
 */
export function AppShell({ name, isAdmin, children }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNav name={name} isAdmin={isAdmin} />
      <main className="app-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </main>
      <BottomTabBar isAdmin={isAdmin} />
    </div>
  );
}
