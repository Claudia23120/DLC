"use client";

import { useState } from "react";
import { RESPONSE_META } from "@/lib/domain/events";
import type { Signup } from "@/lib/data/events";
import { t } from "@/i18n/t";

type Filter = "tots" | "diable" | "tabaler" | "supporter" | "no";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "tots",      label: "Tots" },
  { key: "diable",    label: t.responses.diable },
  { key: "tabaler",   label: t.responses.tabaler },
  { key: "supporter", label: t.responses.supporter },
  { key: "no",        label: "No venen" },
];

/** "Qui s'ha apuntat" — grouped-ish list of responders with car marker. */
export function SignupList({ signups, total }: { signups: Signup[]; total: number }) {
  const [filter, setFilter] = useState<Filter>("tots");
  const responded = signups.length;

  // Only show filter buttons for groups that actually exist
  const activeResponses = new Set(signups.map((s) => s.response));
  const visibleFilters = FILTERS.filter(
    (f) => f.key === "tots" || activeResponses.has(f.key as Signup["response"])
  );

  const filtered = filter === "tots" ? signups : signups.filter((s) => s.response === filter);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontSize: 20, margin: 0 }}>{t.boloDetail.whoSignedUp}</h3>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.boloDetail.responded(responded, total)}</span>
      </div>

      {visibleFilters.length > 2 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {visibleFilters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  padding: "4px 12px",
                  borderRadius: 99,
                  border: active ? "1.5px solid var(--color-accent-500)" : "1.5px solid rgba(32,30,29,.15)",
                  background: active ? "var(--color-accent-100)" : "transparent",
                  color: active ? "var(--color-accent-800)" : "inherit",
                  cursor: "pointer",
                  letterSpacing: ".02em",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 14px" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "12px 0", fontSize: 13, opacity: 0.55 }}>{t.common.empty}</div>
        ) : (
          filtered.map((s) => {
            const meta = RESPONSE_META[s.response];
            const isAttending = s.response === "diable" || s.response === "tabaler" || s.response === "si" || s.response === "supporter";
            const displayName = s.nickname ?? s.full_name;
            const subName = s.nickname ? s.full_name : null;

            return (
              <div key={s.member_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
                <span style={{ width: 7, height: 7, flex: "none", borderRadius: "50%", background: meta.dot, alignSelf: "flex-start", marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName} {s.brings_car ? "🚗" : ""}
                  </div>
                  {subName ? (
                    <div style={{ fontSize: 11, opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {subName}
                    </div>
                  ) : null}
                </div>
                <div style={{ flex: "none", textAlign: "right" }}>
                  <span style={{ fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", color: meta.color, display: "block" }}>
                    {meta.label}
                  </span>
                  {isAttending && s.response === "diable" && (s.sizes.pantalo || s.sizes.casaca) ? (
                    <div style={{ display: "flex", gap: 4, marginTop: 3, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {s.sizes.pantalo ? <SizeChip label="Pant." value={s.sizes.pantalo} /> : null}
                      {s.sizes.casaca ? <SizeChip label="Cas." value={s.sizes.casaca} /> : null}
                    </div>
                  ) : null}
                  {isAttending && s.response === "tabaler" && s.sizes.tabaler ? (
                    <div style={{ display: "flex", gap: 4, marginTop: 3, justifyContent: "flex-end" }}>
                      <SizeChip label="Pant." value={s.sizes.tabaler} />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SizeChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: ".04em",
      padding: "1px 6px",
      borderRadius: 99,
      background: "rgba(32,30,29,.07)",
      color: "var(--color-text)",
      opacity: 0.7,
      whiteSpace: "nowrap",
    }}>
      {label} {value.toUpperCase()}
    </span>
  );
}
