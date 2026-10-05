import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { BottomTabBar } from "./BottomTabBar";

interface AppShellProps {
  name: string;
  isAdmin: boolean;
  children: ReactNode;
}

/**
 * App frame: desktop top nav / mobile bottom tabs with the page content in between
 * (the document itself scrolls). The per-page header lives inside each page.
 */
export function AppShell({ name, isAdmin, children }: AppShellProps) {
  return (
    <div className="min-screen" style={{ display: "flex", flexDirection: "column" }}>
      <TopNav name={name} isAdmin={isAdmin} />
      <main className="app-main">{children}</main>
      <BottomTabBar isAdmin={isAdmin} />
    </div>
  );
}
