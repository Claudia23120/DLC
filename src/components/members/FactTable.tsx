import type { ReactNode } from "react";

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 0",
  borderBottom: "1px solid rgba(32,30,29,.07)",
} as const;

const CARD_STYLE = {
  background: "var(--color-surface)",
  borderRadius: 22,
  boxShadow: "var(--shadow-sm)",
  padding: "4px 16px",
} as const;

export function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={ROW_STYLE}>
      <span style={{ fontSize: 13, opacity: 0.55, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{children}</span>
    </div>
  );
}

/** A titled card of label / value rows. */
export function FactCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 style={{ fontSize: 20, marginBottom: 10 }}>{title}</h3>
      <div style={CARD_STYLE}>{children}</div>
    </div>
  );
}

export function FactTable({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <FactCard title={title}>
      {rows.map((r) => (
        <FactRow key={r.label} label={r.label}>{r.value}</FactRow>
      ))}
    </FactCard>
  );
}
