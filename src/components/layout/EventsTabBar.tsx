import Link from "next/link";

interface Props {
  active: "bolos" | "reunions";
}

export function EventsTabBar({ active }: Props) {
  return (
    <div style={{
      display: "flex",
      gap: 6,
      padding: "2px",
      background: "rgba(32,30,29,.08)",
      borderRadius: 14,
      alignSelf: "flex-start",
      marginBottom: 16,
    }}>
      {(["bolos", "reunions"] as const).map((key) => {
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={`/${key}`}
            style={{
              textDecoration: "none",
              padding: "6px 18px",
              borderRadius: 11,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              background: isActive ? "var(--color-surface)" : "transparent",
              color: isActive ? "var(--color-text)" : "rgba(32,30,29,.45)",
              boxShadow: isActive ? "var(--shadow-sm)" : "none",
              transition: "all .15s",
            }}
          >
            {key === "bolos" ? "Bolos" : "Events"}
          </Link>
        );
      })}
    </div>
  );
}
