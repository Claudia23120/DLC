import type { CSSProperties } from "react";
import type { FocConfig } from "@/lib/domain/foc";

/**
 * Read / print rendering of a fire sheet, matching the paper Excel. Purely
 * presentational — the editor renders this as a live preview and `window.print`
 * prints it (see the `.foc-sheet` print rules in globals.css). Empty sections
 * are omitted so a half-filled sheet still looks clean.
 */

const COLORS = {
  llucifer: "#111111",
  diablessa: "#8a0d0d",
  cremadors: "#e0a418",
  tasques: "#5aa544",
  lluiments: "#e1741e",
  material: "#4a90d9",
};

export function FocSheet({ config }: { config: FocConfig }) {
  const hasCremadors = config.cremadors.some((c) => c.trim());
  const hasTasks = config.tasks.some((row) =>
    config.trams.some((tram) => (row.cells[tram.id] ?? "").trim()),
  );
  const encesses = config.encesses.filter(
    (e) => e.name.trim() || e.lloc.trim() || e.participants.some((p) => p.trim()),
  );
  const responsables = config.responsablesMaterial.filter((r) => r.trim());

  return (
    <div className="foc-sheet" style={sheet}>
      <div style={titleBar}>{config.title || "Correfoc"}</div>

      {/* Llucifer / Diablessa */}
      <div style={{ display: "flex", gap: 10 }}>
        <RoleHeader label="Llucifer" value={config.llucifer} bg={COLORS.llucifer} />
        <RoleHeader label="Diablessa" value={config.diablessa} bg={COLORS.diablessa} />
      </div>

      {hasCremadors ? (
        <Section title="Cremadors" bg={COLORS.cremadors}>
          <NameGrid names={config.cremadors} />
        </Section>
      ) : null}

      {hasTasks ? (
        <Section title="Tasques" bg={COLORS.tasques}>
          <table style={table}>
            <thead>
              <tr>
                <th style={{ ...cell, ...headCell, width: 130 }} />
                {config.trams.map((tram) => (
                  <th key={tram.id} style={{ ...cell, ...headCell }}>
                    {tram.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.tasks.map((row) => (
                <tr key={row.id}>
                  <td style={{ ...cell, fontWeight: 700 }}>{row.label}</td>
                  {config.trams.map((tram) => (
                    <td key={tram.id} style={cell}>
                      {row.cells[tram.id] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      {encesses.length ? (
        <Section title="Lluïments" bg={COLORS.lluiments}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {encesses.map((e) => (
              <div key={e.id} style={{ border: "1px solid #ccc" }}>
                <div style={subHeader}>
                  {[e.name.trim(), e.lloc.trim()].filter(Boolean).join(" - ")}
                </div>
                <NameGrid names={e.participants} borderless />
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {responsables.length ? (
        <Section title="Responsables Material" bg={COLORS.material}>
          <NameGrid names={responsables} />
        </Section>
      ) : null}
    </div>
  );
}

function RoleHeader({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div style={{ flex: 1, border: "1px solid #333" }}>
      <div
        style={{
          background: bg,
          color: "#fff",
          fontWeight: 800,
          textAlign: "center",
          padding: "6px 8px",
          fontSize: 15,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div style={{ textAlign: "center", padding: "8px", minHeight: 22, fontSize: 14 }}>
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  bg,
  children,
}: {
  title: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          background: bg,
          color: "#fff",
          fontWeight: 800,
          textAlign: "center",
          padding: "6px 8px",
          fontSize: 16,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/** A responsive grid of names, like the cremadors block (5 per row on print). */
function NameGrid({ names, borderless }: { names: string[]; borderless?: boolean }) {
  const filled = names.filter((n) => n.trim());
  if (!filled.length) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: borderless ? 0 : 0,
        border: borderless ? "none" : "1px solid #ccc",
      }}
    >
      {filled.map((n, i) => (
        <div
          key={i}
          style={{
            padding: "6px 8px",
            textAlign: "center",
            fontSize: 14,
            borderRight: "1px solid #e2e2e2",
            borderBottom: "1px solid #e2e2e2",
          }}
        >
          {n}
        </div>
      ))}
    </div>
  );
}

const sheet: CSSProperties = {
  background: "#fff",
  color: "#111",
  border: "2px solid #111",
  borderRadius: 8,
  padding: 16,
  fontFamily: "Arial, Helvetica, sans-serif",
};

const titleBar: CSSProperties = {
  border: "2px solid #111",
  textAlign: "center",
  fontWeight: 900,
  fontSize: 26,
  padding: "8px",
  marginBottom: 12,
  textTransform: "none",
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const cell: CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 8px",
  textAlign: "center",
  verticalAlign: "middle",
};

const headCell: CSSProperties = {
  fontWeight: 700,
  background: "#f3f3f3",
  fontSize: 13,
};

const subHeader: CSSProperties = {
  background: "#eee",
  textAlign: "center",
  fontWeight: 700,
  padding: "5px 8px",
  fontSize: 14,
  borderBottom: "1px solid #ccc",
};
