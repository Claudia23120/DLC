"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./navItems";
import { FlameIcon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/Avatar";
import { t } from "@/i18n/t";

interface TopNavProps {
  name: string;
  isAdmin: boolean;
}

/** Desktop top navigation bar (≥1000px). */
export function TopNav({ name, isAdmin }: TopNavProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div
      className="desktop-grid"
      style={{
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "0 40px",
        height: 72,
        flex: "none",
        background: "var(--color-accent-900)",
        color: "#fdece9",
      }}
    >
      <Link href="/bolos" style={{ display: "flex", alignItems: "center", gap: 10, color: "inherit", textDecoration: "none" }}>
        <span style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", background: "var(--color-accent-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FlameIcon size={18} stroke="#fdece9" />
        </span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 14, lineHeight: 1.1, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {t.app.name}
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {visibleItems.map((item) => {
          const on = isActive(item, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 14px",
                borderRadius: 999,
                textDecoration: "none",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                whiteSpace: "nowrap",
                background: on ? "rgba(253,236,233,.14)" : "transparent",
                color: on ? "#fdece9" : "rgba(253,236,233,.7)",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", flex: "none", background: on ? "var(--color-accent-400)" : "rgba(253,236,233,.28)" }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link href="/perfil" style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "end", color: "inherit", textDecoration: "none" }}>
        <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{name}</span>
        <Avatar name={name} size={32} />
      </Link>
    </div>
  );
}
