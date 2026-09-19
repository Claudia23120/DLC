"use client";

import { useState, useTransition } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { setQuotaPaymentAction } from "@/app/(app)/junta/actions";
import { t } from "@/i18n/t";
import type { AdminMemberItem } from "@/lib/data/members";

interface Props {
  members: AdminMemberItem[];
  initialYear: number;
  initialPaidIds: string[];
}

type QuotaFilter = "all" | "domiciliada" | "no-domiciliada";

export function QuotaYearView({ members, initialYear, initialPaidIds }: Props) {
  const [year, setYear] = useState(initialYear);
  const [paidIds, setPaidIds] = useState(new Set(initialPaidIds));
  const [filter, setFilter] = usePersistedState<QuotaFilter>("quota-filter", "all");
  const [fetching, startFetch] = useTransition();

  const billableMembers = members.filter((m) => {
    if (m.member_status === "inactive") return false;
    const joinedYear = m.joined_date ? parseInt(m.joined_date.slice(0, 4), 10) : null;
    if (joinedYear && joinedYear > year) return false;
    if (filter === "domiciliada" && !m.quota_automatic) return false;
    if (filter === "no-domiciliada" && m.quota_automatic) return false;
    return true;
  });
  const paidCount = billableMembers.filter((m) => paidIds.has(m.id)).length;

  function changeYear(delta: number) {
    const newYear = year + delta;
    setYear(newYear);
    startFetch(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("quota_payments")
        .select("member_id")
        .eq("year", newYear)
        .eq("paid", true);
      setPaidIds(new Set((data ?? []).map((r) => r.member_id)));
    });
  }

  function toggle(memberId: string) {
    const paid = !paidIds.has(memberId);
    setPaidIds((prev) => {
      const next = new Set(prev);
      if (paid) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
    setQuotaPaymentAction(memberId, year, paid);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Year selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-surface)", borderRadius: 20, padding: "10px 16px", boxShadow: "var(--shadow-sm)" }}>
        <button
          type="button"
          onClick={() => changeYear(-1)}
          disabled={fetching}
          className="btn btn-secondary"
          style={{ height: 34, width: 34, padding: 0, borderRadius: "50%", fontSize: 16 }}
        >
          ‹
        </button>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{year}</span>
        <button
          type="button"
          onClick={() => changeYear(1)}
          disabled={fetching || year >= initialYear}
          className="btn btn-secondary"
          style={{ height: 34, width: 34, padding: 0, borderRadius: "50%", fontSize: 16 }}
        >
          ›
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "domiciliada", "no-domiciliada"] as QuotaFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              height: 32, padding: "0 12px", borderRadius: 999, fontSize: 12,
              background: filter === f ? "var(--color-accent-900)" : "rgba(32,30,29,.07)",
              color: filter === f ? "#fdece9" : "var(--color-text)",
              border: "none", cursor: "pointer",
            }}
          >
            {f === "all" ? "Totes" : f === "domiciliada" ? "Domiciliada" : "No domiciliada"}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ textAlign: "center", fontSize: 13, opacity: fetching ? 0.4 : 0.6, transition: "opacity .2s" }}>
        {t.junta.quotaPaidSummary(paidCount, billableMembers.length)}
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: "rgba(32,30,29,.1)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          borderRadius: 999,
          background: "var(--color-accent-500)",
          width: billableMembers.length > 0 ? `${(paidCount / billableMembers.length) * 100}%` : "0%",
          transition: "width .3s ease",
        }} />
      </div>

      {/* Member list */}
      <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", overflow: "hidden", opacity: fetching ? 0.6 : 1, transition: "opacity .2s" }}>
        {billableMembers.map((m) => {
          const paid = paidIds.has(m.id);
          return (
            <div
              key={m.id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid rgba(32,30,29,.06)" }}
            >
              <Avatar name={m.full_name} url={m.avatar_url} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.full_name}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                  {m.member_status === "intermittent" && (
                    <span style={{ fontSize: 10, opacity: 0.45 }}>{t.member.statusIntermittent}</span>
                  )}
                  {m.member_status === "inactive" && (
                    <span style={{ fontSize: 10, opacity: 0.45 }}>{t.member.statusInactive}</span>
                  )}
                  {m.quota_automatic && (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(34,197,94,.12)", color: "#16a34a" }}>
                      Domiciliada
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(m.id)}
                className="btn"
                style={{
                  height: 30, padding: "0 14px", borderRadius: 999, fontSize: 12,
                  fontFamily: "var(--font-heading)", flex: "none",
                  background: paid ? "rgba(34,197,94,.12)" : "rgba(32,30,29,.07)",
                  color: paid ? "#16a34a" : "rgba(32,30,29,.45)",
                  border: `1px solid ${paid ? "rgba(34,197,94,.3)" : "rgba(32,30,29,.15)"}`,
                }}
              >
                {paid ? t.junta.quotaMarkPaid : t.junta.quotaMarkUnpaid}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
