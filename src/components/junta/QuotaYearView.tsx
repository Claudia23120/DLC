"use client";

import { useState, useTransition } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { setQuotaPaymentAction, markDomiciliationAction } from "@/app/(app)/junta/actions";
import { t } from "@/i18n/t";
import type { AdminMemberItem } from "@/lib/data/members";
import { Row, Stack } from "@/components/ui/Layout";

interface Props {
  members: AdminMemberItem[];
  initialYear: number;
  initialRows: QuotaRow[];
}

export interface QuotaRow {
  member_id: string;
  paid: boolean;
  installments_paid: number;
}

type QuotaFilter = "all" | "domiciliada" | "no-domiciliada";

export function QuotaYearView({ members, initialYear, initialRows }: Props) {
  const [year, setYear] = useState(initialYear);
  const [rows, setRows] = useState(initialRows);
  const byId = new Map(members.map((m) => [m.id, m]));

  /** Number of installments a member pays in total (1 unless domiciled and split). */
  const totalOf = (id: string) => {
    const m = byId.get(id);
    return m?.quota_automatic ? m.quota_installments : 1;
  };
  /** Installments collected so far (a fully paid row counts as all of them). */
  const doneMap = new Map(rows.map((r) => [r.member_id, r.paid ? totalOf(r.member_id) : r.installments_paid]));
  const doneOf = (id: string) => doneMap.get(id) ?? 0;
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
  const paidCount = billableMembers.filter((m) => doneOf(m.id) >= totalOf(m.id)).length;

  function changeYear(delta: number) {
    const newYear = year + delta;
    setYear(newYear);
    startFetch(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("quota_payments")
        .select("member_id, paid, installments_paid")
        .eq("year", newYear);
      setRows((data ?? []) as QuotaRow[]);
    });
  }

  function applyDone(memberId: string, done: number) {
    setRows((prev) => [
      ...prev.filter((r) => r.member_id !== memberId),
      { member_id: memberId, paid: done >= totalOf(memberId), installments_paid: done },
    ]);
  }

  /** Cycles pending → 1st installment → … → paid → pending. */
  async function toggle(memberId: string) {
    const total = totalOf(memberId);
    const prevDone = doneOf(memberId);
    const done = prevDone >= total ? 0 : prevDone + 1;
    applyDone(memberId, done);
    setError(null);
    try {
      await setQuotaPaymentAction(memberId, year, done, total);
    } catch {
      applyDone(memberId, prevDone); // roll back the optimistic change
      setError(t.junta.quotaSaveError);
    }
  }

  async function markDomiciliation(n: number) {
    if (!window.confirm(t.junta.quotaDomiciliationConfirm(n))) return;
    setError(null);
    startFetch(async () => {
      try {
        await markDomiciliationAction(year, n);
        const supabase = createClient();
        const { data } = await supabase
          .from("quota_payments")
          .select("member_id, paid, installments_paid")
          .eq("year", year);
        setRows((data ?? []) as QuotaRow[]);
      } catch {
        setError(t.junta.quotaSaveError);
      }
    });
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

      <Row gap={8} wrap>
        <button type="button" className="btn btn-secondary btn-sm" disabled={fetching} onClick={() => markDomiciliation(1)}>
          {t.junta.quotaDomiciliation(1)}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={fetching} onClick={() => markDomiciliation(2)}>
          {t.junta.quotaDomiciliation(2)}
        </button>
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
          const total = totalOf(m.id);
          const done = doneOf(m.id);
          const paid = done >= total;
          const half = !paid && done > 0;
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
                      {m.quota_installments > 1 ? ` · ${t.junta.quotaInstallmentsBadge(m.quota_installments)}` : ""}
                    </span>
                  )}
                </Row>
              </div>
              <button
                type="button"
                aria-pressed={paid || half}
                onClick={() => toggle(m.id)}
                className="btn btn-sm"
                style={{
                  padding: "0 14px", borderRadius: 999,
                  fontFamily: "var(--font-heading)",
                  background: paid ? "rgba(34,197,94,.12)" : half ? "rgba(245,158,11,.14)" : "rgba(32,30,29,.07)",
                  color: paid ? "#16a34a" : half ? "#b45309" : "rgba(32,30,29,.45)",
                  border: `1px solid ${paid ? "rgba(34,197,94,.3)" : half ? "rgba(245,158,11,.35)" : "rgba(32,30,29,.15)"}`,
                }}
              >
                {paid ? t.junta.quotaMarkPaid : half ? t.junta.quotaMarkHalf : t.junta.quotaMarkUnpaid}
              </button>
            </div>
          );
        })}
      </div>
    </Stack>
  );
}
