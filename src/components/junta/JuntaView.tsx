"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { setCancelledAction, deleteEventAction } from "@/app/(app)/junta/actions";
import { CreateEventModal } from "@/components/bolos/CreateEventModal";
import { EditEventModal } from "@/components/bolos/EditEventModal";
import { CreateMemberModal } from "@/components/members/CreateMemberModal";
import { QuotaYearView } from "@/components/junta/QuotaYearView";
import type { EventListItem } from "@/lib/data/events";
import type { AdminMemberItem } from "@/lib/data/members";
import { t } from "@/i18n/t";

type Tab = "bolos" | "membres" | "reunions" | "votacions" | "quotes";

export interface JuntaStats {
  activeCount: number;
  inactiveCount: number;
  intermittentCount: number;
  quotaPaidCount: number;
  totalMembersForQuota: number;
  bolosThisYear: number;
  avgAttendance: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ca", { day: "numeric", month: "short", year: "numeric" });
}

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 11, padding: "2px 9px", borderRadius: 999,
      background: bg, color, letterSpacing: ".04em", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function boloStatus(event: EventListItem) {
  if (event.cancelled) return { label: t.junta.cancelled, color: "#dc2626", bg: "rgba(239,68,68,.12)" };
  const future = !event.starts_at || new Date(event.starts_at) > new Date();
  if (future) return { label: t.junta.open, color: "#16a34a", bg: "rgba(34,197,94,.12)" };
  return { label: t.junta.closed, color: "rgba(32,30,29,.45)", bg: "rgba(32,30,29,.07)" };
}

function memberStatusStyle(status: string) {
  if (status === "inactive") return { label: t.member.statusInactive, color: "rgba(32,30,29,.45)", bg: "rgba(32,30,29,.07)" };
  if (status === "intermittent") return { label: t.member.statusIntermittent, color: "#b45309", bg: "rgba(245,158,11,.12)" };
  return { label: t.member.statusActive, color: "#16a34a", bg: "rgba(34,197,94,.12)" };
}

// ── Small action buttons ──────────────────────────────────────────────────

function ActionBtn({
  onClick, disabled, children,
}: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn btn-secondary"
      style={{ height: 30, fontSize: 11, padding: "0 10px", flex: "none" }}
    >
      {children}
    </button>
  );
}

function DeleteBtn({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  function handleDelete() {
    if (!window.confirm(t.create.deleteConfirm)) return;
    startTransition(() => { deleteEventAction(eventId); });
  }
  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="btn btn-secondary"
      style={{ height: 30, fontSize: 11, padding: "0 10px", flex: "none", color: "#dc2626", borderColor: "rgba(220,38,38,.25)" }}
    >
      {t.create.deleteEvent}
    </button>
  );
}

// ── Row components ────────────────────────────────────────────────────────

function BoloRow({ event, onEdit }: { event: EventListItem; onEdit: (e: EventListItem) => void }) {
  const [pending, startTransition] = useTransition();
  const status = boloStatus(event);

  function toggleCancelled() {
    startTransition(() => { setCancelledAction(event.id, !event.cancelled); });
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderBottom: "1px solid rgba(32,30,29,.07)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/bolos/${event.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase", lineHeight: 1.15 }}>
            {event.title}
          </div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{formatDate(event.starts_at)}</div>
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.participants(event.counts.signup_count ?? 0)}</span>
        <StatusPill {...status} />
        <ActionBtn onClick={() => onEdit(event)}>{t.junta.edit}</ActionBtn>
        <ActionBtn onClick={toggleCancelled} disabled={pending}>
          {event.cancelled ? t.junta.reactivateBolo : t.junta.cancelBolo}
        </ActionBtn>
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: AdminMemberItem }) {
  const status = memberStatusStyle(member.member_status);
  return (
    <Link href={`/membres/${member.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderBottom: "1px solid rgba(32,30,29,.07)",
      }}>
        <Avatar name={member.full_name} url={member.avatar_url} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase" }}>
            {member.full_name}
            {member.nickname ? <span style={{ fontFamily: "var(--font-body)", fontSize: 12, opacity: 0.5, marginLeft: 6, textTransform: "none" }}>«{member.nickname}»</span> : null}
          </div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>{member.email}</div>
        </div>
        <StatusPill {...status} />
      </div>
    </Link>
  );
}

function ReunioRow({ event, onEdit }: { event: EventListItem; onEdit: (e: EventListItem) => void }) {
  const future = !event.starts_at || new Date(event.starts_at) > new Date();
  const status = future
    ? { label: t.junta.open, color: "#16a34a", bg: "rgba(34,197,94,.12)" }
    : { label: t.junta.closed, color: "rgba(32,30,29,.45)", bg: "rgba(32,30,29,.07)" };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderBottom: "1px solid rgba(32,30,29,.07)",
    }}>
      <Link href={`/reunions/${event.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase" }}>{event.title}</div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{formatDate(event.starts_at)}</div>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.confirmed(event.counts.confirmed_count ?? 0)}</span>
        <StatusPill {...status} />
        <ActionBtn onClick={() => onEdit(event)}>{t.junta.edit}</ActionBtn>
        <DeleteBtn eventId={event.id} />
      </div>
    </div>
  );
}

function VotacioRow({ event, onEdit }: { event: EventListItem; onEdit: (e: EventListItem) => void }) {
  const closed = !!event.closes_at && new Date(event.closes_at) <= new Date();
  const status = closed
    ? { label: t.junta.pollClosed, color: "rgba(32,30,29,.45)", bg: "rgba(32,30,29,.07)" }
    : { label: t.junta.pollOpen, color: "#16a34a", bg: "rgba(34,197,94,.12)" };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderBottom: "1px solid rgba(32,30,29,.07)",
    }}>
      <Link href={`/reunions/votacions/${event.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase" }}>{event.title}</div>
        {event.closes_at
          ? <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{t.polls.closesOn} {formatDate(event.closes_at)}</div>
          : null}
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.votes(event.counts.vote_count ?? 0)}</span>
        <StatusPill {...status} />
        <ActionBtn onClick={() => onEdit(event)}>{t.junta.edit}</ActionBtn>
        <DeleteBtn eventId={event.id} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function JuntaView({
  events, members, stats, quotaYear, quotaPaidIds,
}: {
  events: EventListItem[];
  members: AdminMemberItem[];
  stats: JuntaStats;
  quotaYear: number;
  quotaPaidIds: string[];
}) {
  const [tab, setTab] = useState<Tab>("bolos");
  const [search, setSearch] = useState("");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null);

  useEffect(() => { setSearch(""); }, [tab]);

  const q = search.toLowerCase();

  const bolos = [...events.filter((e) => e.kind === "bolo")]
    .sort((a, b) => new Date(b.starts_at ?? 0).getTime() - new Date(a.starts_at ?? 0).getTime())
    .filter((e) => !q || e.title.toLowerCase().includes(q));

  const reunions = [...events.filter((e) => e.kind === "reunio")]
    .sort((a, b) => new Date(b.starts_at ?? 0).getTime() - new Date(a.starts_at ?? 0).getTime())
    .filter((e) => !q || e.title.toLowerCase().includes(q));

  const votacions = [...events.filter((e) => e.kind === "votacio")]
    .sort((a, b) => new Date(b.closes_at ?? 0).getTime() - new Date(a.closes_at ?? 0).getTime())
    .filter((e) => !q || e.title.toLowerCase().includes(q));

  const filteredMembers = members.filter((m) =>
    !q || `${m.full_name} ${m.nickname ?? ""} ${m.email}`.toLowerCase().includes(q)
  );

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "bolos", label: t.junta.tabBolos, count: bolos.length },
    { key: "membres", label: t.junta.tabMembres, count: members.length },
    { key: "reunions", label: t.junta.tabReunions, count: reunions.length },
    { key: "votacions", label: t.junta.tabVotacions, count: votacions.length },
    { key: "quotes", label: t.junta.tabQuotes, count: members.filter(m => m.member_status !== "inactive").length },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: t.junta.statsActive, value: `${stats.activeCount}`, sub: `+${stats.intermittentCount} intermit.` },
          { label: t.junta.statsQuota, value: `${stats.quotaPaidCount}/${stats.totalMembersForQuota}`, sub: `${currentYear}` },
          { label: t.junta.statsBolos, value: `${stats.bolosThisYear}`, sub: `${currentYear}` },
          { label: t.junta.statsAvgAttendance, value: `${stats.avgAttendance}`, sub: "persones/bolo" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--color-surface)", borderRadius: 20, boxShadow: "var(--shadow-sm)", padding: "12px 14px" }}>
            <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: ".04em", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{s.value}</div>
            <div style={{ fontSize: 11, opacity: 0.45 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto" }}>
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              height: 36, padding: "0 14px", borderRadius: 999,
              border: "none", cursor: "pointer", fontSize: 13,
              fontFamily: "var(--font-body)", whiteSpace: "nowrap",
              background: tab === tb.key ? "var(--color-accent-900)" : "rgba(32,30,29,.07)",
              color: tab === tb.key ? "#fdece9" : "var(--color-text)",
            }}
          >
            {tb.label}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.65 }}>{tb.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      {tab !== "quotes" && (
        <Input
          placeholder={`Cerca...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 44, marginBottom: 12 }}
        />
      )}

      {/* Create buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tab !== "quotes" && (tab === "bolos" || tab === "reunions" || tab === "votacions") && (
          <button onClick={() => setShowCreateEvent(true)} className="btn btn-primary" style={{ height: 40, fontSize: 13 }}>
            {t.junta.createBolo}
          </button>
        )}
        {tab === "membres" && (
          <>
            <button onClick={() => setShowCreateMember(true)} className="btn btn-primary" style={{ height: 40, fontSize: 13 }}>
              {t.junta.createMember}
            </button>
            <a href="/api/admin/members/csv" download className="btn btn-secondary" style={{ height: 40, fontSize: 13, display: "inline-flex", alignItems: "center" }}>
              {t.junta.exportCSV}
            </a>
          </>
        )}
      </div>

      {/* Content */}
      {tab === "quotes" ? null : <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        {tab === "bolos" && (
          bolos.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noEvents}</p>
            : bolos.map((e) => <BoloRow key={e.id} event={e} onEdit={setEditingEvent} />)
        )}
        {tab === "membres" && (
          filteredMembers.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noMembers}</p>
            : filteredMembers.map((m) => <MemberRow key={m.id} member={m} />)
        )}
        {tab === "reunions" && (
          reunions.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noEvents}</p>
            : reunions.map((e) => <ReunioRow key={e.id} event={e} onEdit={setEditingEvent} />)
        )}
        {tab === "votacions" && (
          votacions.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noEvents}</p>
            : votacions.map((e) => <VotacioRow key={e.id} event={e} onEdit={setEditingEvent} />)
        )}
      </div>}

      {tab === "quotes" && (
        <QuotaYearView
          members={members}
          initialYear={quotaYear}
          initialPaidIds={quotaPaidIds}
        />
      )}

      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
      <CreateMemberModal open={showCreateMember} onClose={() => setShowCreateMember(false)} />
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          open={true}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </>
  );
}
