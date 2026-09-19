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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <section>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>{t.colla.history}</h3>
            {collaContent.history.map((p, i) => (
              <p key={i} style={{ fontSize: 14, margin: i === 0 ? 0 : "10px 0 0" }}>{p}</p>
            ))}
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.colla.board}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {board.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--color-surface)", borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                      {boardPositionLabel(b.board_position)}
                    </div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{b.full_name}</div>
                    <div style={{ fontSize: 12, opacity: 0.55 }}>{b.email}</div>
                  </div>
                  <a href={`mailto:${b.email}`} className="btn btn-icon" style={{ background: "var(--color-accent-100)", color: "var(--color-accent-800)", flex: "none" }} aria-label={`Correu a ${b.full_name}`}>
                    <MailIcon size={18} />
                  </a>
                </div>
              ))}
              {board.length === 0 ? <p className="text-muted">{t.common.empty}</p> : null}
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.colla.fee}</h3>
            <Card style={{ padding: 16, gap: 8 }}>
              <p style={{ fontSize: 14, margin: 0 }}>{collaContent.fee.intro}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg)", borderRadius: 14, padding: "10px 14px" }}>
                <strong style={{ fontSize: 14, flex: 1, fontFamily: "ui-monospace, monospace", letterSpacing: ".02em" }}>{collaContent.fee.iban}</strong>
                <button type="button" className="btn btn-icon" onClick={copyIban} title={t.colla.copyIban} style={{ background: "var(--color-accent-100)", color: "var(--color-accent-800)", flex: "none", width: 36, height: 36 }}>
                  <CopyIcon size={16} />
                </button>
              </div>
              {ibanCopied ? <div style={{ fontSize: 12, color: "var(--color-accent-700)" }}>{t.colla.ibanCopied}</div> : null}
              <p style={{ fontSize: 14, margin: 0 }}>Com a concepte heu de posar: <strong>{collaContent.fee.concept}</strong></p>
            </Card>
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.colla.contacts}</h3>
            <Card style={{ padding: 16, gap: 6 }}>
              {collaContent.contacts.map((c) => (
                <div key={c.email} style={{ fontSize: 14 }}>
                  {c.label} · <a href={`mailto:${c.email}`}>{c.email}</a>
                </div>
              ))}
            </Card>
          </section>
        </div>
      ) : tab === "members" ? (
        <MembersList members={members} isAdmin={isAdmin} />
      ) : tab === "lineage" ? (
        <LineageTab lineage={lineage} />
      ) : (
        <BadgesTab badgesWithCounts={badgesWithCounts} isAdmin={isAdmin} onCreateBadge={() => setCreateBadgeOpen(true)} />
      )}

      {isAdmin ? <CreateBadgeModal open={createBadgeOpen} onClose={() => setCreateBadgeOpen(false)} /> : null}
    </div>
  );
}

function LineageTab({ lineage }: { lineage: LineageItem[] }) {
  if (lineage.length === 0) {
    return <p className="text-muted">{t.common.empty}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lineage.map((m) => (
        <Link
          key={m.id}
          href={`/membres/${m.id}`}
          style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 16px", background: "var(--color-surface)", borderRadius: 24, boxShadow: "var(--shadow-sm)", textDecoration: "none", color: "inherit" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={m.full_name} size={40} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>
              {m.full_name}
              {m.nickname ? <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 6 }}>«{m.nickname}»</span> : null}
            </span>
          </div>
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
    </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {isAdmin ? (
        <button type="button" className="btn btn-primary btn-block" onClick={onCreateBadge} style={{ height: 48 }}>
          {t.colla.createBadge}
        </button>
      ) : null}

      {badgesWithCounts.length === 0 ? (
        <p className="text-muted">{t.common.empty}</p>
      ) : (
        badgesWithCounts.map((b) => (
          <div
            key={b.id}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--color-surface)", borderRadius: 24, boxShadow: "var(--shadow-sm)" }}
          >
            <span style={{ fontSize: 32, flex: "none" }}>{b.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{b.name}</div>
              {b.description ? <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{b.description}</div> : null}
            </div>
            <div style={{ fontSize: 12, opacity: 0.5, flex: "none" }}>
              {t.colla.badgeEarnedBy(b.member_count)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
