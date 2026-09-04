import type { MemberBadgeWithDef } from "@/lib/data/badges";

export function BadgeGrid({ badges }: { badges: MemberBadgeWithDef[] }) {
  if (badges.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {badges.map((mb) => (
        <div
          key={mb.id}
          title={mb.badge.description ?? mb.badge.name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "10px 14px",
            background: "var(--color-surface)",
            borderRadius: 20,
            boxShadow: "var(--shadow-sm)",
            minWidth: 76,
          }}
        >
          <span style={{ fontSize: 28 }}>{mb.badge.icon}</span>
          <span style={{ fontSize: 11, fontFamily: "var(--font-heading)", textAlign: "center", lineHeight: 1.2 }}>
            {mb.badge.name}
          </span>
        </div>
      ))}
    </div>
  );
}
