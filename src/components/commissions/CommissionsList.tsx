"use client";

import { useState, useTransition } from "react";
import { Row, Stack } from "@/components/ui/Layout";
import { Input } from "@/components/ui/Input";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { matchesCommissionSearch } from "@/lib/domain/commissions";
import { COMMISSION_SECTIONS, CommissionCard } from "./CommissionCard";
import {
  getCommissionsAction,
  joinCommissionAction,
  leaveCommissionAction,
} from "@/app/(app)/bolos/commission-actions";
import { t } from "@/i18n/t";
import type { CommissionWithMembers } from "@/lib/data/commissions";

/** Member view: commissions grouped by kind. The current year allows join /
 *  leave; past years are read-only, showing who was signed up. */
export function CommissionsList({
  currentYear,
  firstYear,
  commissions,
  currentUserId,
}: {
  currentYear: number;
  firstYear: number;
  commissions: CommissionWithMembers[];
  currentUserId: string;
}) {
  const [search, setSearch] = usePersistedState("commissions-search", "");
  const [year, setYear] = useState(currentYear);
  const [pastCommissions, setPastCommissions] = useState<CommissionWithMembers[]>([]);
  const [fetching, startFetch] = useTransition();
  const isCurrent = year === currentYear;

  function changeYear(delta: number) {
    const next = year + delta;
    setYear(next);
    if (next === currentYear) return;
    startFetch(async () => {
      setPastCommissions(await getCommissionsAction(next));
    });
  }

  const shown = isCurrent ? commissions : pastCommissions;
  const filtered = shown.filter((c) => matchesCommissionSearch(c, search));

  return (
    <Stack gap={22}>
      <Row justify="between" style={{ background: "var(--color-surface)", borderRadius: 20, padding: "10px 16px", boxShadow: "var(--shadow-sm)" }}>
        <button
          type="button"
          onClick={() => changeYear(-1)}
          aria-label={t.commissions.prevYear}
          disabled={fetching || year <= firstYear}
          className="btn btn-secondary btn-icon"
          style={{ borderRadius: "50%", fontSize: 16 }}
        >
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{year}</div>
          {!isCurrent ? <div style={{ fontSize: 11, opacity: 0.55 }}>{t.commissions.pastYear}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => changeYear(1)}
          aria-label={t.commissions.nextYear}
          disabled={fetching || year >= currentYear}
          className="btn btn-secondary btn-icon"
          style={{ borderRadius: "50%", fontSize: 16 }}
        >
          ›
        </button>
      </Row>

      {fetching ? (
        <p className="text-muted">{t.common.loading}</p>
      ) : shown.length === 0 ? (
        <p className="text-muted">{t.commissions.empty(year)}</p>
      ) : (
        <CommissionSections
          commissions={filtered}
          search={search}
          onSearch={setSearch}
          currentUserId={isCurrent ? currentUserId : null}
        />
      )}
    </Stack>
  );
}

function CommissionSections({
  commissions: filtered,
  search,
  onSearch: setSearch,
  currentUserId,
}: {
  commissions: CommissionWithMembers[];
  search: string;
  onSearch: (q: string) => void;
  /** null = read-only (past year): no join / leave buttons. */
  currentUserId: string | null;
}) {
  return (
    <Stack gap={22}>
      <Input
        type="search"
        placeholder={t.commissions.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ height: 46 }}
      />
      {filtered.length === 0 ? <p className="text-muted">{t.commissions.noResults}</p> : null}
      {COMMISSION_SECTIONS.map(({ kind, title }) => {
        const list = filtered.filter((c) => c.kind === kind);
        if (list.length === 0) return null;
        return (
          <section key={kind}>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{title}</h3>
            <Stack gap={10}>
              {list.map((c) => (
                <CommissionCard
                  key={c.id}
                  commission={c}
                  actions={currentUserId ? <JoinButton commission={c} currentUserId={currentUserId} /> : undefined}
                />
              ))}
            </Stack>
          </section>
        );
      })}
    </Stack>
  );
}

function JoinButton({ commission: c, currentUserId }: { commission: CommissionWithMembers; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const joined = c.members.some((m) => m.id === currentUserId);
  const full = c.max_members !== null && c.members.length >= c.max_members;

  function run(action: (id: string) => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action(c.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      {joined ? (
        <>
          <span style={{ fontSize: 13, color: "var(--color-sage-700)", alignSelf: "center" }}>{t.commissions.joined}</span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run(leaveCommissionAction)}>
            {t.commissions.leave}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={pending || full}
          onClick={() => run(joinCommissionAction)}
        >
          {full ? t.commissions.full : t.commissions.join}
        </button>
      )}
      {error ? <span role="alert" style={{ fontSize: 12, color: "var(--color-accent-500)" }}>{error}</span> : null}
    </>
  );
}
