import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { MeetingResponseButtons } from "@/components/meetings/MeetingResponseButtons";
import { AttendeeList } from "@/components/meetings/AttendeeList";
import { CommentSection } from "@/components/bolos/CommentSection";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getComments } from "@/lib/data/events";
import { getMeetingAttendees, getMyMeetingResponse } from "@/lib/data/meetings";
import { eventDetailHref, KIND_META } from "@/lib/domain/events";
import { formatWhen } from "@/lib/utils/dates";
import { t } from "@/i18n/t";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const event = await getEvent(supabase, id);
  if (!event) notFound();
  if (event.kind !== "reunio") redirect(eventDetailHref(event.id, event.kind));

  const [attendees, myResponse, comments] = await Promise.all([
    getMeetingAttendees(supabase, id),
    getMyMeetingResponse(supabase, id, profile.id),
    getComments(supabase, id),
  ]);

  const meta = [event.starts_at ? formatWhen(event.starts_at) : null, event.location].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader kicker={t.kinds.reunio} title={event.title} showBack userName={profile.full_name} />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 18, gap: 10 }}>
            <Tag variant="custom" bg={KIND_META.reunio.bg} color={KIND_META.reunio.color} style={{ alignSelf: "flex-start" }}>
              {t.kinds.reunio}
            </Tag>
            <div className="card-title" style={{ fontSize: 20, marginTop: 6 }}>{event.title}</div>
            {meta ? <div style={{ fontSize: 13, opacity: 0.6 }}>{meta}</div> : null}
            {event.agenda ? <p style={{ fontSize: 14, margin: "8px 0 0" }}>{event.agenda}</p> : null}
            {event.affects ? (
              <div style={{ fontSize: 13, opacity: 0.6 }}>{t.create.affects}: {event.affects}</div>
            ) : null}
            {event.acta_url ? (
              <a
                href={event.acta_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  fontSize: 14,
                  color: "var(--color-accent-500)",
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)",
                }}
              >
                📄 {t.meetings.actaLabel}
              </a>
            ) : null}
          </Card>

          <MeetingResponseButtons eventId={event.id} initial={myResponse} />

          <AttendeeList names={attendees} />

          <CommentSection eventId={event.id} comments={comments} />
        </div>
      </PageContainer>
    </>
  );
}
