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
            position: "relative",
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
          {mb.repte_count != null && mb.repte_count > 0 ? (
            <span style={{
              position: "absolute",
              top: 6,
              right: 6,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: "var(--color-accent-500)",
              color: "#fff",
              fontSize: 10,
              fontFamily: "var(--font-heading)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}>
              {mb.repte_count}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
