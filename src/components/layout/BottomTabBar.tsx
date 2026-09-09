"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./navItems";

/** Mobile bottom tab bar (<1000px). */
export function BottomTabBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div
      className="mobile-only"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "10px 12px 26px",
        background: "var(--color-surface)",
        boxShadow: "0 -6px 20px rgba(46,43,37,.08)",
      }}
    >
      {visibleItems.map((item) => {
        const on = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 0",
              fontSize: 10,
              letterSpacing: ".04em",
              fontFamily: "var(--font-body)",
              textDecoration: "none",
              color: on ? "var(--color-accent-500)" : "rgba(32,30,29,.42)",
            }}
          >
            <Icon size={24} />
            {item.tabLabel}
          </Link>
        );
      })}
    </div>
  );
}
