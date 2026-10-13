import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { Row, Stack } from "@/components/ui/Layout";
import { commissionDurationLabel, commissionPeriodLabel } from "@/lib/domain/commissions";
import { t } from "@/i18n/t";
import type { CommissionWithMembers } from "@/lib/data/commissions";
import type { CommissionKind } from "@/types/database";

/** Red for the colla's own commissions, green for the ones shared with other entities. */
export const KIND_COLORS: Record<CommissionKind, { bg: string; color: string }> = {
  propia: { bg: "var(--color-accent-100)", color: "var(--color-accent-800)" },
  entitats: { bg: "var(--color-sage-100)", color: "var(--color-sage-800)" },
};

/** The groups commissions are listed in, in display order. */
export const COMMISSION_SECTIONS: { kind: CommissionKind; title: string }[] = [
  { kind: "propia", title: t.commissions.kindPropia },
  { kind: "entitats", title: t.commissions.kindEntitats },
];

/** One commission: period, description, requirements and who's signed up. */
export function CommissionCard({
  commission: c,
  fullNames = false,
  actions,
  memberActions,
}: {
  commission: CommissionWithMembers;
  /** Show "Full name (nick)" instead of just the nickname (junta view). */
  fullNames?: boolean;
  /** Buttons shown at the bottom (join / leave, edit / delete…). */
  actions?: ReactNode;
  /** Optional control rendered after each member chip (e.g. a remove button). */
  memberActions?: (memberId: string) => ReactNode;
}) {
  const colors = KIND_COLORS[c.kind];
  const duration = commissionDurationLabel(c);

  return (
    <Stack gap={10} className="item-card" style={{ borderLeft: `4px solid ${colors.color}` }}>
      <div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>{c.name}</div>
        <Row gap={6} wrap style={{ marginTop: 6 }}>
          <Tag variant="custom" bg={colors.bg} color={colors.color}>{commissionPeriodLabel(c)}</Tag>
          {duration ? <Tag>{duration}</Tag> : null}
          <Tag variant="outline">{t.commissions.places(c.members.length, c.max_members)}</Tag>
        </Row>
      </div>

      {c.description ? (
        <p style={{ fontSize: 14, margin: 0, whiteSpace: "pre-line" }}>{c.description}</p>
      ) : null}

      {c.requirements ? (
        <div style={{ fontSize: 13 }}>
          <span className="caption">{t.commissions.requirements}</span>{" "}
          <span style={{ whiteSpace: "pre-line" }}>{c.requirements}</span>
        </div>
      ) : null}

      {c.members.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.5 }}>{t.commissions.noMembers}</div>
      ) : (
        <Row gap={6} wrap>
          {c.members.map((m) => (
            <Row
              key={m.id}
              gap={6}
              style={{ background: "var(--color-bg)", borderRadius: 999, padding: "3px 10px 3px 3px", fontSize: 13 }}
            >
              <Avatar name={m.full_name} url={m.avatar_url} size={24} bg={colors.bg} color={colors.color} />
              <span>
                {fullNames
                  ? (m.nickname ? `${m.full_name} (${m.nickname})` : m.full_name)
                  : (m.nickname || m.full_name)}
              </span>
              {memberActions?.(m.id)}
            </Row>
          ))}
        </Row>
      )}

      {actions ? <Row gap={8} wrap>{actions}</Row> : null}
    </Stack>
  );
}
