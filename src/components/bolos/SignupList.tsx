import { RESPONSE_META } from "@/lib/domain/events";
import type { Signup } from "@/lib/data/events";
import { t } from "@/i18n/t";

/** "Qui s'ha apuntat" — grouped-ish list of responders with car marker. */
export function SignupList({ signups, total }: { signups: Signup[]; total: number }) {
  const responded = signups.length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontSize: 20, margin: 0 }}>{t.boloDetail.whoSignedUp}</h3>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.boloDetail.responded(responded, total)}</span>
      </div>
      <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 14px" }}>
        {signups.length === 0 ? (
          <div style={{ padding: "12px 0", fontSize: 13, opacity: 0.55 }}>{t.common.empty}</div>
        ) : (
          signups.map((s) => {
            const meta = RESPONSE_META[s.response];
            return (
              <div key={s.member_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
                <span style={{ width: 7, height: 7, flex: "none", borderRadius: "50%", background: meta.dot, alignSelf: "flex-start", marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.full_name} {s.brings_car ? "🚗" : ""}
                  </div>
                </div>
                <span style={{ fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", color: meta.color, flex: "none", textAlign: "right" }}>
                  {meta.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
