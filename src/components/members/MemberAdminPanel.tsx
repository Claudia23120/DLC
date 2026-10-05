import { grantBadgeAction, revokeBadgeAction } from "@/app/(app)/colla/badge-actions";
import { saveAdminFields, saveQuotaPayments } from "@/app/(app)/membres/[id]/actions";
import { t } from "@/i18n/t";
import type { BoardPosition } from "@/types/database";
import type { MemberRow } from "@/lib/data/members";
import type { BadgeDefinitionRow } from "@/lib/data/badges";
import { Row, Stack } from "@/components/ui/Layout";

const BOARD_POSITIONS: BoardPosition[] = [
  "presidenta",
  "vicepresidenta",
  "secretaria",
  "tresorera",
  "cap_de_foc",
  "cap_de_tabals",
];

/** Board-only controls on a member's page: badges, internal data and quota payments. */
export function MemberAdminPanel({
  member,
  manualBadges,
  earnedBadgeIds,
  quotaPayments,
}: {
  member: MemberRow;
  manualBadges: BadgeDefinitionRow[];
  earnedBadgeIds: Set<string>;
  quotaPayments: Record<number, boolean>;
}) {
  const id = member.id;
  return (
    <>
      {manualBadges.length > 0 ? (
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.assignBadges}</h3>
          <Stack gap={8}>
            {manualBadges.map((b) => {
              const hasIt = earnedBadgeIds.has(b.id);
              const action = hasIt ? revokeBadgeAction.bind(null, id, b.id) : grantBadgeAction.bind(null, id, b.id);
              return (
                <form key={b.id} action={action} className="row surface-card" style={{ gap: 10, padding: "10px 14px", borderRadius: 20 }}>
                  <span style={{ fontSize: 22 }}>{b.icon}</span>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-heading)", fontSize: 14 }}>{b.name}</span>
                  <button type="submit" className={hasIt ? "btn btn-secondary" : "btn btn-primary"} style={{ height: 44, fontSize: 13, padding: "0 14px", flex: "none" }}>
                    {hasIt ? t.member.revokeBadge : t.member.grantBadge}
                  </button>
                </form>
              );
            })}
          </Stack>
        </div>
      ) : null}

      <div>
        <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.adminSection}</h3>
        <form
          action={saveAdminFields.bind(null, id)}
          key={`${member.member_status}-${member.board_position}-${member.has_cre}-${member.has_rgcre}-${member.quota_automatic}`}
          className="surface-card"
          style={{ padding: 16 }}
        >
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="member_status" className="caption" style={{ display: "block", marginBottom: 6 }}>{t.member.memberStatus}</label>
            <select id="member_status" name="member_status" className="input" defaultValue={member.member_status} style={{ height: 44 }}>
              <option value="active">{t.member.statusActive}</option>
              <option value="inactive">{t.member.statusInactive}</option>
              <option value="intermittent">{t.member.statusIntermittent}</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="board_position" className="caption" style={{ display: "block", marginBottom: 6 }}>{t.member.boardPositionField}</label>
            <select id="board_position" name="board_position" className="input" defaultValue={member.board_position ?? ""} style={{ height: 44 }}>
              <option value="">{t.member.noBoardPosition}</option>
              {BOARD_POSITIONS.map((p) => (
                <option key={p} value={p}>{t.boardPositions[p]}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="check-row">
              <input type="checkbox" name="has_cre" defaultChecked={member.has_cre} />
              {t.member.hasCre}
            </label>
            <label className="check-row">
              <input type="checkbox" name="has_rgcre" defaultChecked={member.has_rgcre} />
              {t.member.hasRgcre}
            </label>
            <label className="check-row">
              <input type="checkbox" name="quota_automatic" defaultChecked={member.quota_automatic} />
              {t.member.quotaAutomatic}
            </label>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 18px" }}>
            {t.common.save}
          </button>
        </form>
      </div>

      {!member.quota_automatic ? (
        <QuotaPaymentsSection
          memberId={id}
          joinedYear={member.joined_date ? new Date(member.joined_date).getFullYear() : null}
          payments={quotaPayments}
        />
      ) : null}
    </>
  );
}

function QuotaPaymentsSection({
  memberId,
  joinedYear,
  payments,
}: {
  memberId: string;
  joinedYear: number | null;
  payments: Record<number, boolean>;
}) {
  const currentYear = new Date().getFullYear();
  const startYear = joinedYear ?? currentYear - 4;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div>
      <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.quotaSection}</h3>
      <form action={saveQuotaPayments.bind(null, memberId)} className="surface-card" style={{ padding: "4px 16px 16px" }}>
        <input type="hidden" name="years" value={years.join(",")} />
        {years.map((year) => {
          const paid = payments[year] ?? false;
          return (
            <Row key={year} gap={10} className="list-row">
              <span style={{ fontSize: 14, flex: 1, fontVariantNumeric: "tabular-nums" }}>{year}</span>
              <label className="check-row" style={{ fontSize: 13, gap: 8 }}>
                <input type="checkbox" name={`paid_${year}`} defaultChecked={paid} />
                <span style={{ color: paid ? "var(--color-accent-600)" : "rgba(32,30,29,.45)" }}>
                  {paid ? t.member.quotaPaid : t.member.quotaUnpaid}
                </span>
              </label>
            </Row>
          );
        })}
        <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 18px", marginTop: 12 }}>
          {t.member.quotaSave}
        </button>
      </form>
    </div>
  );
}
