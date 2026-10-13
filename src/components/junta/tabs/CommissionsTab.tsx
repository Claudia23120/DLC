"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Row, Stack } from "@/components/ui/Layout";
import { COMMISSION_SECTIONS, CommissionCard } from "@/components/commissions/CommissionCard";
import {
  addCommissionMemberAction,
  deleteCommissionAction,
  duplicateCommissionsAction,
  removeCommissionMemberAction,
} from "@/app/(app)/bolos/commission-actions";
import { membersWithoutCommission } from "@/lib/domain/commissions";
import { t } from "@/i18n/t";
import type { CommissionWithMembers } from "@/lib/data/commissions";
import type { AdminMemberItem } from "@/lib/data/members";
import { ActionBtn, DangerBtn } from "./parts";

/** Junta view of one year's commissions (past, current or next): edit /
 *  delete, add or remove members. On the current year it also lists who isn't
 *  in any commission and offers to duplicate them for next year. */
export function CommissionsTab({
  year,
  currentYear,
  firstYear,
  nextYearHasCommissions,
  commissions,
  members,
  onEdit,
}: {
  year: number;
  currentYear: number;
  firstYear: number;
  nextYearHasCommissions: boolean;
  commissions: CommissionWithMembers[];
  members: AdminMemberItem[];
  onEdit: (c: CommissionWithMembers) => void;
}) {
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const active = members.filter((m) => m.member_status !== "inactive");
  // "Sense comissió" only counts fully active members, not "active without quota".
  const without = membersWithoutCommission(members.filter((m) => m.member_status === "active"), commissions);
  const isCurrent = year === currentYear;
  // Who can be added: only active members for this year and the next; past
  // years also offer members who have since become inactive.
  const candidatePool = year >= currentYear ? active : members;

  function goToYear(next: number) {
    const href = next === currentYear ? "/junta" : `/junta?any=${next}`;
    startNavigation(() => router.push(href, { scroll: false }));
  }

  return (
    <Stack gap={22}>
      <Row justify="between" style={{ background: "var(--color-surface)", borderRadius: 20, padding: "10px 16px", boxShadow: "var(--shadow-sm)" }}>
        <button
          type="button"
          onClick={() => goToYear(year - 1)}
          aria-label={t.commissions.prevYear}
          disabled={navigating || year <= firstYear}
          className="btn btn-secondary btn-icon"
          style={{ borderRadius: "50%", fontSize: 16 }}
        >
          ‹
        </button>
        <div style={{ textAlign: "center", opacity: navigating ? 0.5 : 1 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{year}</div>
          {!isCurrent ? (
            <div style={{ fontSize: 11, opacity: 0.55 }}>
              {year < currentYear ? t.commissions.pastYearAdmin : t.commissions.nextYearAdmin}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => goToYear(year + 1)}
          aria-label={t.commissions.nextYear}
          disabled={navigating || year >= currentYear + 1}
          className="btn btn-secondary btn-icon"
          style={{ borderRadius: "50%", fontSize: 16 }}
        >
          ›
        </button>
      </Row>

      {isCurrent ? <section>
        <h3 style={{ fontSize: 18, marginBottom: 10 }}>
          {t.commissions.withoutTitle(year)}
          <span style={{ marginLeft: 8, fontSize: 14, opacity: 0.55 }}>{without.length}</span>
        </h3>
        {without.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 14 }}>{t.commissions.withoutAll}</p>
        ) : (
          <Row gap={6} wrap>
            {without.map((m) => (
              <Link
                key={m.id}
                href={`/membres/${m.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
                  background: "var(--color-surface)", boxShadow: "var(--shadow-sm)",
                  borderRadius: 999, padding: "3px 10px 3px 3px", color: "inherit", textDecoration: "none",
                }}
              >
                <Avatar name={m.full_name} url={m.avatar_url} size={24} />
                {m.nickname || m.full_name}
              </Link>
            ))}
          </Row>
        )}
      </section> : null}

      <section>
        <Row justify="between" wrap gap={8} style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 18, margin: 0 }}>{t.commissions.year(year)}</h3>
          {isCurrent && commissions.length > 0 ? <DuplicateButton year={year} alreadyDone={nextYearHasCommissions} /> : null}
        </Row>
        {commissions.length === 0 ? (
          <p className="text-muted">{t.commissions.empty(year)}</p>
        ) : null}
      </section>

      {COMMISSION_SECTIONS.map(({ kind, title }) => {
        const list = commissions.filter((c) => c.kind === kind);
        if (list.length === 0) return null;
        return (
          <section key={kind}>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{title}</h3>
            <Stack gap={10}>
              {list.map((c) => (
                <AdminCommissionCard key={c.id} commission={c} members={candidatePool} onEdit={() => onEdit(c)} />
              ))}
            </Stack>
          </section>
        );
      })}
    </Stack>
  );
}

/** Hidden once next year has commissions, except for the confirmation shown
 *  right after duplicating. */
function DuplicateButton({ year, alreadyDone }: { year: number; alreadyDone: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function handleClick() {
    if (!window.confirm(t.commissions.duplicateConfirm(year, year + 1))) return;
    setMessage(null);
    startTransition(async () => {
      const res = await duplicateCommissionsAction(year);
      setMessage(res.error
        ? { ok: false, text: res.error }
        : { ok: true, text: t.commissions.duplicated(res.count ?? 0, year + 1) });
    });
  }

  if (alreadyDone && !message?.ok) return null;

  return (
    <Row gap={8} wrap>
      {message ? (
        <span role="status" style={{ fontSize: 12, color: message.ok ? "var(--color-sage-700)" : "var(--color-accent-500)" }}>
          {message.text}
        </span>
      ) : null}
      {!alreadyDone ? (
        <ActionBtn onClick={handleClick} disabled={pending}>
          {pending ? t.common.loading : t.commissions.duplicate(year + 1)}
        </ActionBtn>
      ) : null}
    </Row>
  );
}

function AdminCommissionCard({
  commission: c,
  members,
  onEdit,
}: {
  commission: CommissionWithMembers;
  members: AdminMemberItem[];
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inIds = new Set(c.members.map((m) => m.id));
  const candidates = members.filter((m) => !inIds.has(m.id));

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
    });
  }

  return (
    <CommissionCard
      commission={c}
      fullNames
      memberActions={(memberId) => (
        <button
          type="button"
          aria-label={t.commissions.remove}
          title={t.commissions.remove}
          disabled={pending}
          onClick={() => run(() => removeCommissionMemberAction(c.id, memberId))}
          style={{ border: 0, background: "none", padding: 0, cursor: "pointer", opacity: 0.5, fontSize: 14, lineHeight: 1 }}
        >
          ×
        </button>
      )}
      actions={
        <>
          {candidates.length > 0 ? (
            <select
              className="input"
              value=""
              disabled={pending}
              onChange={(e) => {
                const memberId = e.target.value;
                if (memberId) run(() => addCommissionMemberAction(c.id, memberId));
              }}
              style={{ height: 30, fontSize: 12, padding: "0 10px", width: "auto", maxWidth: "100%" }}
            >
              <option value="">{t.commissions.addMember}</option>
              {candidates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nickname ? `${m.full_name} (${m.nickname})` : m.full_name}
                  {m.member_status === "inactive" ? ` · ${t.commissions.inactiveMember}` : ""}
                </option>
              ))}
            </select>
          ) : null}
          <ActionBtn onClick={onEdit}>{t.commissions.edit}</ActionBtn>
          <DangerBtn
            label={t.commissions.delete}
            confirmText={t.commissions.deleteConfirm}
            onConfirm={() => deleteCommissionAction(c.id)}
          />
          {error ? <span role="alert" style={{ fontSize: 12, color: "var(--color-accent-500)" }}>{error}</span> : null}
        </>
      }
    />
  );
}
