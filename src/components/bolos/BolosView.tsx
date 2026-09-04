"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Input } from "@/components/ui/Input";
import { Tag } from "@/components/ui/Tag";
import { EventCard } from "./EventCard";
import { CalendarMonth } from "./CalendarMonth";
import { CreateEventModal } from "./CreateEventModal";
import { isPast } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { EventListItem } from "@/lib/data/events";
import type { EventKind } from "@/types/database";

type View = "llista" | "calendari" | "historic";
type Filter = "Tot" | "bolo" | "reunio" | "votacio";

/** Relevant date used to decide upcoming vs. past. */
function relevantDate(e: EventListItem): string | null {
  return e.kind === "votacio" ? e.closes_at : e.starts_at;
}

export function BolosView({ events, isAdmin }: { events: EventListItem[]; isAdmin: boolean }) {
  const [view, setView] = useState<View>("llista");
  const [filter, setFilter] = useState<Filter>("Tot");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filterChips: { value: Filter; label: string }[] = [
    { value: "Tot", label: t.bolos.filterAll },
    { value: "bolo", label: t.bolos.filterBolos },
    { value: "reunio", label: t.bolos.filterMeetings },
    { value: "votacio", label: t.bolos.filterPolls },
  ];

  const byFilter = (e: EventListItem) => filter === "Tot" || e.kind === (filter as EventKind);

  const upcoming = useMemo(
    () => events.filter((e) => !isPast(relevantDate(e))).filter(byFilter),
    [events, filter],
  );

  const history = useMemo(
    () =>
      events
        .filter((e) => isPast(relevantDate(e)))
        .filter((e) => e.title.toLowerCase().includes(search.toLowerCase())),
    [events, search],
  );

  // Season summary (admins only).
  const stats = useMemo(() => {
    const bolos = events.filter((e) => e.kind === "bolo");
    const pendingBolos = bolos.filter((e) => !isPast(e.starts_at) && !e.myResponse).length;
    const openPolls = events.filter((e) => e.kind === "votacio" && !isPast(e.closes_at)).length;
    return [
      { n: String(bolos.length), label: "Bolos en total" },
      { n: String(pendingBolos), label: "Bolos sense la teva resposta" },
      { n: String(openPolls), label: "Votacions obertes" },
    ];
  }, [events]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SegmentedControl
        options={[
          { value: "llista", label: t.bolos.tabList },
          { value: "calendari", label: t.bolos.tabCalendar },
          { value: "historic", label: t.bolos.tabHistory },
        ]}
        value={view}
        onChange={setView}
      />

      {view === "llista" ? (
        <>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {filterChips.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilter(c.value)}
                style={{
                  height: 34,
                  padding: "0 16px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: filter === c.value ? "var(--color-accent-500)" : "rgba(32,30,29,.22)",
                  background: filter === c.value ? "var(--color-accent-500)" : "transparent",
                  color: filter === c.value ? "#fff" : "var(--color-text)",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {isAdmin ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: 28, background: "var(--color-accent-900)", color: "#fdece9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tag variant="custom" bg="rgba(253,236,233,.14)" color="#fdece9">Junta</Tag>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{t.bolos.seasonSummary}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {stats.map((s) => (
                  <div key={s.label} style={{ flex: 1, background: "rgba(253,236,233,.09)", borderRadius: 20, padding: "12px 10px" }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, lineHeight: 1.25 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-primary btn-block" onClick={() => setCreateOpen(true)} style={{ height: 48, background: "var(--color-accent-500)" }}>
                {t.bolos.create}
              </button>
            </div>
          ) : null}

          <div className="event-grid">
            {upcoming.length === 0 ? (
              <p className="text-muted">{t.common.empty}</p>
            ) : (
              upcoming.map((e) => <EventCard key={e.id} event={e} />)
            )}
          </div>
        </>
      ) : null}

      {view === "calendari" ? <CalendarMonth events={events} /> : null}

      {view === "historic" ? (
        <>
          <Input
            placeholder={t.bolos.searchHistory}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: 46, marginBottom: 4 }}
          />
          <div className="event-grid">
            {history.length === 0 ? (
              <p className="text-muted">{t.common.empty}</p>
            ) : (
              history.map((e) => <EventCard key={e.id} event={e} />)
            )}
          </div>
        </>
      ) : null}

      {isAdmin ? <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} /> : null}
    </div>
  );
}
