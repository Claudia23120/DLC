import type { ReactNode } from "react";

export function AdminOnly({ children }: { children: ReactNode }) {
  return (
    <div style={{
      borderRadius: 22,
      border: "1.5px solid rgba(198,47,40,.3)",
      background: "rgba(198,47,40,.04)",
      padding: 2,
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px 2px",
      }}>
        <span style={{
          fontSize: 10,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--color-accent-600, #c62f28)",
          opacity: 0.7,
          fontWeight: 600,
        }}>
          Només junta
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 10px 10px" }}>
        {children}
      </div>
    </div>
  );
}
