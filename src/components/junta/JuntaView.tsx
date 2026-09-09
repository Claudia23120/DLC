"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setCancelledAction } from "@/app/(app)/junta/actions";
import { CreateEventModal } from "@/components/bolos/CreateEventModal";
import { CreateMemberModal } from "@/components/members/CreateMemberModal";
import type { EventListItem } from "@/lib/data/events";
import type { AdminMemberItem } from "@/lib/data/members";
import { t } from "@/i18n/t";

type Tab = "bolos" | "membres" | "reunions" | "votacions";

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

// ── Row components ────────────────────────────────────────────────────────

function BoloRow({ event }: { event: EventListItem }) {
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.participants(event.counts.signup_count ?? 0)}</span>
        <StatusPill {...status} />
        <button
          onClick={toggleCancelled}
          disabled={pending}
          className="btn btn-secondary"
          style={{ height: 30, fontSize: 11, padding: "0 10px" }}
        >
          {event.cancelled ? t.junta.reactivateBolo : t.junta.cancelBolo}
        </button>
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
        padding: "12px 16px", borderBottom: "1px solid rgba(32,30,29,.07)",
      }}>
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

function ReunioRow({ event }: { event: EventListItem }) {
  const future = !event.starts_at || new Date(event.starts_at) > new Date();
  const status = future
    ? { label: t.junta.open, color: "#16a34a", bg: "rgba(34,197,94,.12)" }
    : { label: t.junta.closed, color: "rgba(32,30,29,.45)", bg: "rgba(32,30,29,.07)" };

  return (
    <Link href={`/reunions/${event.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderBottom: "1px solid rgba(32,30,29,.07)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase" }}>{event.title}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{formatDate(event.starts_at)}</div>
        </div>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.confirmed(event.counts.confirmed_count ?? 0)}</span>
        <StatusPill {...status} />
      </div>
    </Link>
  );
}

function VotacioRow({ event }: { event: EventListItem }) {
  const closed = !!event.closes_at && new Date(event.closes_at) <= new Date();
  const status = closed
    ? { label: t.junta.pollClosed, color: "rgba(32,30,29,.45)", bg: "rgba(32,30,29,.07)" }
    : { label: t.junta.pollOpen, color: "#16a34a", bg: "rgba(34,197,94,.12)" };

  return (
    <Link href={`/reunions/votacions/${event.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderBottom: "1px solid rgba(32,30,29,.07)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase" }}>{event.title}</div>
          {event.closes_at
            ? <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{t.polls.closesOn} {formatDate(event.closes_at)}</div>
            : null}
        </div>
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.votes(event.counts.vote_count ?? 0)}</span>
        <StatusPill {...status} />
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function JuntaView({ events, members }: { events: EventListItem[]; members: AdminMemberItem[] }) {
  const [tab, setTab] = useState<Tab>("bolos");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);

  const bolos = [...events.filter((e) => e.kind === "bolo")].sort((a, b) => {
    if (!a.starts_at) return 1;
    if (!b.starts_at) return -1;
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });
  const reunions = [...events.filter((e) => e.kind === "reunio")].sort((a, b) => {
    if (!a.starts_at) return 1;
    if (!b.starts_at) return -1;
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });
  const votacions = [...events.filter((e) => e.kind === "votacio")].sort((a, b) => {
    if (!a.closes_at) return 1;
    if (!b.closes_at) return -1;
    return new Date(b.closes_at).getTime() - new Date(a.closes_at).getTime();
  });

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "bolos", label: t.junta.tabBolos, count: bolos.length },
    { key: "membres", label: t.junta.tabMembres, count: members.length },
    { key: "reunions", label: t.junta.tabReunions, count: reunions.length },
    { key: "votacions", label: t.junta.tabVotacions, count: votacions.length },
  ];

  return (
    <>
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

      {/* Create buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(tab === "bolos" || tab === "reunions" || tab === "votacions") && (
          <button onClick={() => setShowCreateEvent(true)} className="btn btn-primary" style={{ height: 40, fontSize: 13 }}>
            {t.junta.createBolo}
          </button>
        )}
        {tab === "membres" && (
          <button onClick={() => setShowCreateMember(true)} className="btn btn-primary" style={{ height: 40, fontSize: 13 }}>
            {t.junta.createMember}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        {tab === "bolos" && (
          bolos.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noEvents}</p>
            : bolos.map((e) => <BoloRow key={e.id} event={e} />)
        )}
        {tab === "membres" && (
          members.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noMembers}</p>
            : members.map((m) => <MemberRow key={m.id} member={m} />)
        )}
        {tab === "reunions" && (
          reunions.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noEvents}</p>
            : reunions.map((e) => <ReunioRow key={e.id} event={e} />)
        )}
        {tab === "votacions" && (
          votacions.length === 0
            ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{t.junta.noEvents}</p>
            : votacions.map((e) => <VotacioRow key={e.id} event={e} />)
        )}
      </div>

      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
      <CreateMemberModal open={showCreateMember} onClose={() => setShowCreateMember(false)} />
    </>
  );
}
