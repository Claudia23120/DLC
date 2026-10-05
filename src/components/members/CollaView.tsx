"use client";

import { useState } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Card } from "@/components/ui/Card";
import { MembersList } from "./MembersList";
import { CreateBadgeModal } from "./CreateBadgeModal";
import { CopyIcon, MailIcon } from "@/components/ui/icons";
import { boardPositionLabel } from "@/lib/utils/labels";
import { collaContent } from "@/content/colla";
import { t } from "@/i18n/t";
import type { MemberListItem, LineageItem } from "@/lib/data/members";
import type { BadgeWithCount } from "@/lib/data/badges";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Row, Stack } from "@/components/ui/Layout";

type Tab = "info" | "members" | "lineage" | "badges";

export function CollaView({
  board,
  members,
  isAdmin,
  lineage,
  badgesWithCounts,
}: {
  board: MemberListItem[];
  members: MemberListItem[];
  isAdmin: boolean;
  lineage: LineageItem[];
  badgesWithCounts: BadgeWithCount[];
}) {
  const [tab, setTab] = usePersistedState<Tab>("colla-tab", "info");
  const [ibanCopied, setIbanCopied] = useState(false);
  const [createBadgeOpen, setCreateBadgeOpen] = useState(false);

  const copyIban = () => {
    navigator.clipboard.writeText(collaContent.fee.iban.replace(/\s/g, "")).catch(() => {});
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 2000);
  };

  return (
    <Stack gap={16}>
      <SegmentedControl
        options={[
          { value: "info", label: t.colla.tabInfo },
          { value: "members", label: t.colla.tabMembers },
          { value: "lineage", label: t.colla.tabLineage },
          { value: "badges", label: t.colla.tabBadges },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "info" ? (
        <Stack gap={22}>
          <section>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>{t.colla.history}</h3>
            {collaContent.history.map((p, i) => (
              <p key={i} style={{ fontSize: 14, margin: i === 0 ? 0 : "10px 0 0" }}>{p}</p>
            ))}
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.colla.board}</h3>
            <Stack gap={10}>
              {board.map((b) => (
                <Row key={b.id} gap={12} className="item-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                      {boardPositionLabel(b.board_position)}
                    </div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{b.full_name}</div>
                    <div className="break-anywhere" style={{ fontSize: 12, opacity: 0.55 }}>{b.email}</div>
                  </div>
                  <a href={`mailto:${b.email}`} className="btn btn-icon" style={{ background: "var(--color-accent-100)", color: "var(--color-accent-800)", flex: "none" }} aria-label={`Correu a ${b.full_name}`}>
                    <MailIcon size={18} />
                  </a>
                </Row>
              ))}
              {board.length === 0 ? <p className="text-muted">{t.common.empty}</p> : null}
            </Stack>
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.colla.fee}</h3>
            <Card style={{ padding: 16, gap: 8 }}>
              <p style={{ fontSize: 14, margin: 0 }}>{collaContent.fee.intro}</p>
              <Row gap={8} style={{ background: "var(--color-bg)", borderRadius: 14, padding: "10px 14px" }}>
                <strong style={{ fontSize: 14, flex: 1, minWidth: 0, fontFamily: "ui-monospace, monospace", letterSpacing: ".02em" }}>{collaContent.fee.iban}</strong>
                <button type="button" className="btn btn-icon" onClick={copyIban} title={t.colla.copyIban} style={{ background: "var(--color-accent-100)", color: "var(--color-accent-800)", flex: "none" }}>
                  <CopyIcon size={16} />
                </button>
              </Row>
              {ibanCopied ? <div style={{ fontSize: 12, color: "var(--color-accent-700)" }}>{t.colla.ibanCopied}</div> : null}
              <p style={{ fontSize: 14, margin: 0 }}>Com a concepte heu de posar: <strong>{collaContent.fee.concept}</strong></p>
            </Card>
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.colla.contacts}</h3>
            <Card style={{ padding: 16, gap: 6 }}>
              {collaContent.contacts.map((c) => (
                <div key={c.email} className="break-anywhere" style={{ fontSize: 14 }}>
                  {c.label} · <a href={`mailto:${c.email}`}>{c.email}</a>
                </div>
              ))}
            </Card>
          </section>
        </Stack>
      ) : tab === "members" ? (
        <MembersList members={members} isAdmin={isAdmin} />
      ) : tab === "lineage" ? (
        <LineageTab lineage={lineage} />
      ) : (
        <BadgesTab badgesWithCounts={badgesWithCounts} isAdmin={isAdmin} onCreateBadge={() => setCreateBadgeOpen(true)} />
      )}

      {isAdmin ? <CreateBadgeModal open={createBadgeOpen} onClose={() => setCreateBadgeOpen(false)} /> : null}
    </Stack>
  );
}

function LineageTab({ lineage }: { lineage: LineageItem[] }) {
  if (lineage.length === 0) {
    return <p className="text-muted">{t.common.empty}</p>;
  }

  return (
    <Stack gap={10}>
      {lineage.map((m) => (
        <Link
          key={m.id}
          href={`/membres/${m.id}`}
          className="item-card stack"
          style={{ gap: 6, textDecoration: "none", color: "inherit" }}
        >
          <Row gap={10}>
            <Avatar name={m.full_name} size={40} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>
              {m.full_name}
              {m.nickname ? <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 6 }}>«{m.nickname}»</span> : null}
            </span>
          </Row>
          {m.padri_foc ? (
            <div style={{ fontSize: 12, opacity: 0.7, paddingLeft: 50 }}>
              🔥 Padrí de foc: <strong>{m.padri_foc.full_name}</strong>
            </div>
          ) : null}
          {m.padri_tabal ? (
            <div style={{ fontSize: 12, opacity: 0.7, paddingLeft: 50 }}>
              🥁 Padrí de tabal: <strong>{m.padri_tabal.full_name}</strong>
            </div>
          ) : null}
        </Link>
      ))}
    </Stack>
  );
}

function BadgesTab({
  badgesWithCounts,
  isAdmin,
  onCreateBadge,
}: {
  badgesWithCounts: BadgeWithCount[];
  isAdmin: boolean;
  onCreateBadge: () => void;
}) {
  return (
    <Stack gap={12}>
      {isAdmin ? (
        <button type="button" className="btn btn-primary btn-block" onClick={onCreateBadge} style={{ height: 48 }}>
          {t.colla.createBadge}
        </button>
      ) : null}

      {badgesWithCounts.length === 0 ? (
        <p className="text-muted">{t.common.empty}</p>
      ) : (
        badgesWithCounts.map((b) => (
          <Row key={b.id} gap={14} className="item-card">
            <span style={{ fontSize: 32, flex: "none" }}>{b.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{b.name}</div>
              {b.description ? <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{b.description}</div> : null}
            </div>
            <div style={{ fontSize: 12, opacity: 0.5, flex: "none" }}>
              {t.colla.badgeEarnedBy(b.member_count)}
            </div>
          </Row>
        ))
      )}
    </Stack>
  );
}
