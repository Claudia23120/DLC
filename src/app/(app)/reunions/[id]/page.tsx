import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ClockIcon, MapPinIcon } from "@/components/ui/icons";
import { CommentSection } from "@/components/bolos/CommentSection";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getComments } from "@/lib/data/events";
import { eventDetailHref, KIND_META } from "@/lib/domain/events";
import { formatLongDate, formatTime } from "@/lib/utils/dates";
import { t } from "@/i18n/t";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const event = await getEvent(supabase, id);
  if (!event) notFound();
  if (event.kind !== "event") redirect(eventDetailHref(event.id, event.kind));

  const comments = await getComments(supabase, id);

  return (
    <>
      <PageHeader
        kicker={event.starts_at ? formatLongDate(event.starts_at) : t.kinds.reunio}
        title={event.title}
        showBack
        userName={profile.full_name}
      />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Info card */}
          <Card style={{ padding: 18, gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag variant="custom" bg={KIND_META.event.bg} color={KIND_META.event.color}>
                {t.kinds.reunio}
              </Tag>
              {event.affects ? (
                <Tag variant="neutral">{event.affects}</Tag>
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {event.starts_at ? (
                <InfoRow
                  icon={<ClockIcon size={18} stroke="var(--color-accent-500)" />}
                  title={`${formatLongDate(event.starts_at)} · ${formatTime(event.starts_at)} h`}
                />
              ) : null}
              {event.location ? (
                <InfoRow
                  icon={<MapPinIcon size={18} stroke="var(--color-accent-500)" />}
                  title={event.location}
                />
              ) : null}
            </div>
          </Card>

          {/* Agenda */}
          {event.agenda ? (
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ fontSize: 16, margin: 0, letterSpacing: ".04em", textTransform: "uppercase", opacity: 0.55 }}>
                {t.meetings.agenda}
              </h3>
              <Card style={{ padding: 16, gap: 0 }}>
                {event.agenda.split("\n").filter(Boolean).map((line, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: i < event.agenda!.split("\n").filter(Boolean).length - 1
                        ? "1px solid rgba(32,30,29,.07)"
                        : "none",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ opacity: 0.35, fontVariantNumeric: "tabular-nums", flex: "none" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{line.replace(/^\d+[\.\-\)]\s*/, "")}</span>
                  </div>
                ))}
              </Card>
            </section>
          ) : null}

          {/* Acta */}
          {event.acta_url ? (
            <a
              href={event.acta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-block"
              style={{ height: 48, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <span>📄</span> {t.meetings.actaLabel}
            </a>
          ) : null}

          <CommentSection eventId={event.id} comments={comments} />
        </div>
      </PageContainer>
    </>
  );
}

function InfoRow({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
      <span style={{ flex: "none" }}>{icon}</span>
      <span>{title}</span>
    </div>
  );
}
