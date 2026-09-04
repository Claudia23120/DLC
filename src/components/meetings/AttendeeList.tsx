import { t } from "@/i18n/t";

/** "Qui hi assisteix" — confirmed meeting attendees. */
export function AttendeeList({ names }: { names: string[] }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontSize: 20, margin: 0 }}>{t.meetings.whoAttends}</h3>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.meetings.attendCount(names.length)}</span>
      </div>
      <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 14px" }}>
        {names.length === 0 ? (
          <div style={{ padding: "12px 0", fontSize: 13, opacity: 0.55 }}>{t.common.empty}</div>
        ) : (
          names.map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
              <span style={{ width: 7, height: 7, flex: "none", borderRadius: "50%", background: "var(--color-sage-500)" }} />
              <span style={{ fontSize: 14 }}>{name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
