"use client";

import { useState, useTransition } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { setQuotaPaymentAction } from "@/app/(app)/junta/actions";
import { t } from "@/i18n/t";
import type { AdminMemberItem } from "@/lib/data/members";
import { Row, Stack } from "@/components/ui/Layout";

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
  const [error, setError] = useState<string | null>(null);

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
      setPaidIds(new Set((data ?? []).map((r: { member_id: string }) => r.member_id)));
    });
  }

  function applyPaid(memberId: string, paid: boolean) {
    setPaidIds((prev) => {
      const next = new Set(prev);
      if (paid) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  }

  async function toggle(memberId: string) {
    const paid = !paidIds.has(memberId);
    applyPaid(memberId, paid);
    setError(null);
    try {
      await setQuotaPaymentAction(memberId, year, paid);
    } catch {
      applyPaid(memberId, !paid); // roll back the optimistic change
      setError(t.junta.quotaSaveError);
    }
  }

  return (
    <Stack gap={12}>
      {/* Year selector */}
      <Row justify="between" style={{ background: "var(--color-surface)", borderRadius: 20, padding: "10px 16px", boxShadow: "var(--shadow-sm)" }}>
        <button
          type="button"
          onClick={() => changeYear(-1)}
          aria-label={t.junta.quotaPrevYear}
          disabled={fetching}
          className="btn btn-secondary btn-icon"
          style={{ borderRadius: "50%", fontSize: 16 }}
        >
          ‹
        </button>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{year}</span>
        <button
          type="button"
          onClick={() => changeYear(1)}
          aria-label={t.junta.quotaNextYear}
          disabled={fetching || year >= initialYear}
          className="btn btn-secondary btn-icon"
          style={{ borderRadius: "50%", fontSize: 16 }}
        >
          ›
        </button>
      </Row>

      {/* Filter */}
      <Row gap={6} wrap>
        {(["all", "domiciliada", "no-domiciliada"] as QuotaFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="tab-pill tab-pill-sm"
          >
            {f === "all" ? t.junta.quotaFilterAll : f === "domiciliada" ? t.junta.quotaFilterDomiciliada : t.junta.quotaFilterNoDomiciliada}
          </button>
        ))}
      </Row>

      {error ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)", textAlign: "center" }} role="alert">
          {error}
        </p>
      ) : null}

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
      <div className="surface-card" style={{ overflow: "hidden", opacity: fetching ? 0.6 : 1, transition: "opacity .2s" }}>
        {billableMembers.map((m) => {
          const paid = paidIds.has(m.id);
          return (
            <div key={m.id} className="admin-row">
              <Avatar name={m.full_name} url={m.avatar_url} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.full_name}
                </div>
                <Row gap={4} wrap style={{ marginTop: 2 }}>
                  {m.member_status === "intermittent" && (
                    <span style={{ fontSize: 10, opacity: 0.45 }}>{t.member.statusIntermittent}</span>
                  )}
                  {m.member_status === "inactive" && (
                    <span style={{ fontSize: 10, opacity: 0.45 }}>{t.member.statusInactive}</span>
                  )}
                  {m.quota_automatic && (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(34,197,94,.12)", color: "#16a34a" }}>
                      {t.junta.quotaFilterDomiciliada}
                    </span>
                  )}
                </Row>
              </div>
              <button
                type="button"
                aria-pressed={paid}
                onClick={() => toggle(m.id)}
                className="btn btn-sm"
                style={{
                  padding: "0 14px", borderRadius: 999,
                  fontFamily: "var(--font-heading)",
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
    </Stack>
  );
}
