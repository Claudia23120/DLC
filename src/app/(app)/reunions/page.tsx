import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { EventsTabBar } from "@/components/layout/EventsTabBar";
import { Tag } from "@/components/ui/Tag";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/data/events";
import { isPast, formatLongDate, formatTime } from "@/lib/utils/dates";
import { KIND_META } from "@/lib/domain/events";
import { t } from "@/i18n/t";
import type { EventListItem } from "@/lib/data/events";

function relevantDate(e: EventListItem): string | null {
  return e.kind === "votacio" ? e.closes_at : e.starts_at;
}

function EventCard({ event }: { event: EventListItem }) {
  const href = event.kind === "votacio"
    ? `/reunions/votacions/${event.id}`
    : `/reunions/${event.id}`;

  const meta = KIND_META[event.kind];
  const past = isPast(relevantDate(event));

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "var(--color-surface)",
        borderRadius: 22,
        boxShadow: "var(--shadow-sm)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        opacity: past ? 0.7 : 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag variant="custom" bg={meta.bg} color={meta.color} style={{ fontSize: 10 }}>
            {meta.label}
          </Tag>
          {event.kind === "votacio" && event.closes_at && !past && (
            <Tag variant="custom" bg="rgba(34,197,94,.12)" color="#16a34a" style={{ fontSize: 10 }}>
              {t.junta.pollOpen}
            </Tag>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 17, textTransform: "uppercase", lineHeight: 1.2 }}>
          {event.title}
        </div>
        {event.starts_at && event.kind !== "votacio" ? (
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            {formatLongDate(event.starts_at)} · {formatTime(event.starts_at)} h
            {event.location ? ` · ${event.location}` : ""}
          </div>
        ) : null}
        {event.kind === "votacio" && event.closes_at ? (
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            {past ? t.junta.pollClosed : `${t.polls.closesOn} ${new Date(event.closes_at).toLocaleDateString("ca", { day: "numeric", month: "long" })}`}
            {" · "}{t.junta.votes(event.counts.vote_count ?? 0)}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default async function ReunionsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const allEvents = await listEvents(supabase, profile.id);
  const meetingEvents = allEvents.filter((e) => e.kind === "event" || e.kind === "votacio");

  const upcoming = meetingEvents
    .filter((e) => !isPast(relevantDate(e)))
    .sort((a, b) => {
      const da = relevantDate(a) ?? "";
      const db = relevantDate(b) ?? "";
      return da < db ? -1 : 1;
    });

  const past = meetingEvents
    .filter((e) => isPast(relevantDate(e)))
    .sort((a, b) => {
      const da = relevantDate(a) ?? "";
      const db = relevantDate(b) ?? "";
      return da > db ? -1 : 1;
    });

  return (
    <>
      <PageHeader kicker={t.meetings.upcoming} title={t.kinds.reunio} userName={profile.full_name} />
      <PageContainer>
        <EventsTabBar active="reunions" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {upcoming.length > 0 ? (
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </section>
          ) : (
            <p style={{ opacity: 0.5, fontSize: 14 }}>{t.common.empty}</p>
          )}

          {past.length > 0 ? (
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.45, margin: 0 }}>
                {t.bolos.tabHistory}
              </h3>
              {past.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </section>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}
