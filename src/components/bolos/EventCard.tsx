import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { AddToCalendarButton } from "./AddToCalendarButton";
import { KIND_META, RESPONSE_META, eventDetailHref, countLabel } from "@/lib/domain/events";
import { formatDay, formatMonthShort, formatTime, isPast } from "@/lib/utils/dates";
import { googleCalendarUrl } from "@/lib/calendar/ics";
import { t } from "@/i18n/t";
import type { EventListItem } from "@/lib/data/events";

/** Status pill text + colors for the card, by kind. */
function statusFor(event: EventListItem): { label: string; bg: string; color: string } {
  const kind = KIND_META[event.kind];
  if (event.kind === "bolo") {
    if (event.myResponse) {
      const r = RESPONSE_META[event.myResponse];
      return { label: r.label, bg: r.bg, color: r.color };
    }
    return { label: t.responses.noResponse, bg: "var(--color-accent-100)", color: "var(--color-accent-800)" };
  }
  if (event.kind === "event") {
    return { label: isPast(event.starts_at) ? "Passada" : "Confirma assistència", bg: kind.bg, color: kind.color };
  }
  const closed = event.closes_at ? isPast(event.closes_at) : false;
  return { label: closed ? t.polls.closed : t.polls.open, bg: kind.bg, color: kind.color };
}

export function EventCard({ event }: { event: EventListItem }) {
  const kind = KIND_META[event.kind];
  const status = statusFor(event);
  const dateIso = event.kind === "votacio" ? event.closes_at : event.starts_at;

  const metaParts = [
    event.starts_at ? formatTime(event.starts_at) : null,
    event.location,
  ].filter(Boolean);

  const showCalendar = event.kind !== "votacio" && event.starts_at;
  const icsHref = `/api/events/${event.id}/ics`;
  const googleHref = event.starts_at
    ? googleCalendarUrl({
        uid: event.id,
        title: event.title,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        start: event.starts_at,
      })
    : "#";

  return (
    <Card
      style={{
        flexDirection: "row",
        gap: 14,
        padding: 16,
        alignItems: "flex-start",
        borderLeft: `5px solid ${kind.dot}`,
      }}
    >
      <Link
        href={eventDetailHref(event.id, event.kind)}
        style={{ display: "flex", gap: 14, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit", alignItems: "flex-start" }}
      >
        {dateIso ? (
          <div style={{ width: 58, flex: "none", borderRadius: 20, background: kind.bg, color: kind.color, textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, lineHeight: 1 }}>{formatDay(dateIso)}</div>
            <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }}>{formatMonthShort(dateIso)}</div>
          </div>
        ) : null}

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: kind.color }}>{kind.label}</span>
          <div className="card-title" style={{ fontSize: 18, marginTop: 2 }}>{event.title}</div>
          {metaParts.length ? (
            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{metaParts.join(" · ")}</div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <Tag variant="custom" bg={status.bg} color={status.color}>{status.label}</Tag>
            <span style={{ fontSize: 12, opacity: 0.55 }}>{countLabel(event.kind, event.counts)}</span>
          </div>
        </div>
      </Link>

      {showCalendar ? <AddToCalendarButton icsHref={icsHref} googleHref={googleHref} variant="icon" /> : null}
    </Card>
  );
}
