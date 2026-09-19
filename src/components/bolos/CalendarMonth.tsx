"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { Tag } from "@/components/ui/Tag";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { KIND_META, eventDetailHref } from "@/lib/domain/events";
import { madridParts, monthYearLabel, WEEKDAYS_CAL, formatDay, formatMonthShort, formatTime } from "@/lib/utils/dates";
import { googleCalendarUrl } from "@/lib/calendar/ics";
import type { EventListItem } from "@/lib/data/events";

export interface BirthdayItem {
  id: string;
  full_name: string;
  nickname: string | null;
  birth_date: string;
}

/** Relevant calendar date for an event (bolo/reunió start, votació close). */
function eventDate(e: EventListItem): string | null {
  return e.kind === "votacio" ? e.closes_at : e.starts_at;
}

export function CalendarMonth({ events, birthdays = [] }: { events: EventListItem[]; birthdays?: BirthdayItem[] }) {
  const now = madridParts(new Date().toISOString());
  const [cursor, setCursor] = useState({ year: now.year, month: now.month });

  const inMonth = useMemo(
    () =>
      events
        .filter((e) => {
          const iso = eventDate(e);
          if (!iso) return false;
          const p = madridParts(iso);
          return p.year === cursor.year && p.month === cursor.month;
        })
        .sort((a, b) => (eventDate(a)! < eventDate(b)! ? -1 : 1)),
    [events, cursor],
  );

  // birthdays this month (recurring — match only month and day)
  const birthdaysInMonth = useMemo(
    () =>
      birthdays
        .filter((b) => {
          const parts = b.birth_date.slice(5, 7); // "MM"
          return parseInt(parts, 10) === cursor.month;
        })
        .map((b) => ({ ...b, day: parseInt(b.birth_date.slice(8, 10), 10) }))
        .sort((a, b) => a.day - b.day),
    [birthdays, cursor],
  );

  // day-of-month → kind (for the coloured dot)
  const marks = useMemo(() => {
    const m = new Map<number, keyof typeof KIND_META>();
    for (const e of inMonth) {
      const day = madridParts(eventDate(e)!).day;
      if (!m.has(day)) m.set(day, e.kind);
    }
    return m;
  }, [inMonth]);

  // days with birthdays
  const birthdayDays = useMemo(
    () => new Set(birthdaysInMonth.map((b) => b.day)),
    [birthdaysInMonth],
  );

  const firstWeekday = new Date(Date.UTC(cursor.year, cursor.month - 1, 1)).getUTCDay(); // 0=Sun
  const leadingBlanks = (firstWeekday + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month, 0)).getUTCDate();
  const isCurrentMonth = now.year === cursor.year && now.month === cursor.month;

  const step = (delta: number) =>
    setCursor((c) => {
      const idx = c.month - 1 + delta;
      return { year: c.year + Math.floor(idx / 12), month: ((idx % 12) + 12) % 12 + 1 };
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "var(--color-surface)", borderRadius: 28, boxShadow: "var(--shadow-sm)", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" className="btn btn-icon" aria-label="Mes anterior" onClick={() => step(-1)} style={{ width: 34, height: 34, background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>
            <ChevronLeftIcon size={16} />
          </button>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, textTransform: "uppercase" }}>
            {monthYearLabel(cursor.year, cursor.month)}
          </div>
          <button type="button" className="btn btn-icon" aria-label="Mes següent" onClick={() => step(1)} style={{ width: 34, height: 34, background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>
            <ChevronRightIcon size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 44px))", gap: 4, marginBottom: 4, justifyContent: "center" }}>
          {WEEKDAYS_CAL.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.45 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 44px))", gap: 4, justifyContent: "center" }}>
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const kind = marks.get(day);
            const hasBirthday = birthdayDays.has(day);
            const isToday = isCurrentMonth && day === now.day;
            return (
              <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    background: kind ? KIND_META[kind].dot : "transparent",
                    color: kind ? "#fff" : "var(--color-text)",
                    boxShadow: isToday ? "inset 0 0 0 2px var(--color-accent-500)" : undefined,
                  }}
                >
                  {day}
                </div>
                {hasBirthday ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c4619e", display: "block", flexShrink: 0 }} /> : null}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          {(["bolo", "event", "votacio"] as const).map((k) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.7 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: KIND_META[k].dot }} />
              {KIND_META[k].label}
            </span>
          ))}
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.7 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#c4619e", flexShrink: 0 }} />
            Aniversari
          </span>
        </div>
      </div>

      {/* Agenda for the visible month */}
      <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 14px" }}>
        {inMonth.length === 0 && birthdaysInMonth.length === 0 ? (
          <div style={{ padding: "16px 0", fontSize: 13, opacity: 0.55 }}>Cap esdeveniment aquest mes.</div>
        ) : (() => {
          type AgendaEntry =
            | { type: "event"; day: number; event: EventListItem }
            | { type: "birthday"; day: number; birthday: BirthdayItem & { day: number } };

          const entries: AgendaEntry[] = [
            ...inMonth.map((e) => ({ type: "event" as const, day: madridParts(eventDate(e)!).day, event: e })),
            ...birthdaysInMonth.map((b) => ({ type: "birthday" as const, day: b.day, birthday: b })),
          ].sort((a, b) => a.day - b.day);

          return entries.map((entry, i) => {
            if (entry.type === "event") {
              const e = entry.event;
              const iso = eventDate(e)!;
              const kind = KIND_META[e.kind];
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
                  <div style={{ width: 34, flex: "none", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, lineHeight: 1 }}>{formatDay(iso)}</div>
                    <div style={{ fontSize: 9, textTransform: "uppercase", opacity: 0.5 }}>{formatMonthShort(iso)}</div>
                  </div>
                  <Link href={eventDetailHref(e.id, e.kind)} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                    <div style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.55 }}>
                      {[e.starts_at ? formatTime(e.starts_at) : null, e.location].filter(Boolean).join(" · ")}
                    </div>
                  </Link>
                  <Tag variant="custom" bg={kind.bg} color={kind.color} style={{ flex: "none" }}>{kind.label}</Tag>
                  {e.starts_at ? (
                    <AddToCalendarButton
                      icsHref={`/api/events/${e.id}/ics`}
                      googleHref={googleCalendarUrl({ uid: e.id, title: e.title, start: e.starts_at, location: e.location ?? undefined })}
                      variant="icon"
                    />
                  ) : null}
                </div>
              );
            }

            const b = entry.birthday;
            const displayName = b.nickname ? `${b.full_name} «${b.nickname}»` : b.full_name;
            return (
              <div key={`bd-${b.id}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
                <div style={{ width: 34, flex: "none", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, lineHeight: 1 }}>{b.day}</div>
                  <div style={{ fontSize: 9, textTransform: "uppercase", opacity: 0.5 }}>{formatMonthShort(`${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`)}</div>
                </div>
                <Link href={`/membres/${b.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c4619e", flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</span>
                  </div>
                </Link>
                <Tag variant="neutral" style={{ flex: "none" }}>Aniversari</Tag>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
