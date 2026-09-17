import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { MapPinIcon, ClockIcon, OrganizerIcon } from "@/components/ui/icons";
import { AddToCalendarButton } from "@/components/bolos/AddToCalendarButton";
import { AttendancePicker } from "@/components/bolos/AttendancePicker";
import { SignupList } from "@/components/bolos/SignupList";
import { CommentSection } from "@/components/bolos/CommentSection";
import { BoloAdminSummary, type SummaryCell } from "@/components/bolos/BoloAdminSummary";
import { BoloAttendanceAdmin } from "@/components/bolos/BoloAttendanceAdmin";
import { BoloFocEditor } from "@/components/bolos/BoloFocEditor";
import { BoloOptionsAdmin } from "@/components/bolos/BoloOptionsAdmin";
import { AdminOnly } from "@/components/ui/AdminOnly";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getBoloSignups, getComments, getMyBoloResponse, getEventOptions, getMyOptionResponses } from "@/lib/data/events";
import { listMembers } from "@/lib/data/members";
import { eventDetailHref, RESPONSE_META, KIND_META } from "@/lib/domain/events";
import { googleCalendarUrl } from "@/lib/calendar/ics";
import { formatLongDate, formatTime } from "@/lib/utils/dates";
import { t } from "@/i18n/t";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BoloDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const event = await getEvent(supabase, id);
  if (!event) notFound();
  // Meetings / polls have their own detail routes.
  if (event.kind !== "bolo") redirect(eventDetailHref(event.id, event.kind));

  const [signups, comments, mine, { count: memberCount }, allMembers, eventOptions, myOptionResponses] = await Promise.all([
    getBoloSignups(supabase, id),
    getComments(supabase, id),
    getMyBoloResponse(supabase, id, profile.id),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    profile.is_admin ? listMembers(supabase) : Promise.resolve([]),
    getEventOptions(supabase, id),
    getMyOptionResponses(supabase, id, profile.id),
  ]);

  const totalMembers = memberCount ?? 0;

  // Admin summary counts by response.
  const by = (r: string) => signups.filter((s) => s.response === r).length;
  const cars = signups.filter((s) => s.brings_car).length;
  const hasRoles = event.allowed_roles.length > 0;
  const summaryCells: SummaryCell[] = hasRoles
    ? [
        { label: t.responses.diable,    value: String(by("diable")),    bg: RESPONSE_META.diable.bg,    color: RESPONSE_META.diable.color },
        { label: t.responses.tabaler,   value: String(by("tabaler")),   bg: RESPONSE_META.tabaler.bg,   color: RESPONSE_META.tabaler.color },
        { label: t.responses.supporter, value: String(by("supporter")), bg: RESPONSE_META.supporter.bg, color: RESPONSE_META.supporter.color },
        { label: t.responses.no,        value: String(by("no")),        bg: RESPONSE_META.no.bg,        color: RESPONSE_META.no.color },
        { label: t.responses.noResponse, value: String(Math.max(0, totalMembers - signups.length)), bg: "var(--color-surface)", color: "var(--color-muted-text)" },
        { label: "Cotxes", value: String(cars), bg: "var(--color-sage-100)", color: "var(--color-sage-800)" },
      ]
    : [
        { label: t.responses.si,  value: String(by("si")),  bg: RESPONSE_META.si.bg,  color: RESPONSE_META.si.color },
        { label: t.responses.no,  value: String(by("no")),  bg: RESPONSE_META.no.bg,  color: RESPONSE_META.no.color },
        { label: t.responses.noResponse, value: String(Math.max(0, totalMembers - signups.length)), bg: "var(--color-surface)", color: "var(--color-muted-text)" },
        { label: "Cotxes", value: String(cars), bg: "var(--color-sage-100)", color: "var(--color-sage-800)" },
      ];

  const icsHref = `/api/events/${event.id}/ics`;
  const googleHref = event.starts_at
    ? googleCalendarUrl({ uid: event.id, title: event.title, description: event.description ?? undefined, location: event.location ?? undefined, start: event.starts_at })
    : "#";

  return (
    <>
      <PageHeader
        kicker={event.starts_at ? formatLongDate(event.starts_at) : KIND_META.bolo.label}
        title={event.title}
        showBack
        userName={profile.full_name}
      />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Info card */}
          <Card style={{ padding: 18, gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Tag variant="accent">{KIND_META.bolo.label}</Tag>
              {event.starts_at ? <Tag variant="neutral">{formatLongDate(event.starts_at)}</Tag> : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {event.location ? (
                <InfoRow icon={<MapPinIcon size={18} stroke="var(--color-accent-500)" />} title={event.location} note={event.place_note} />
              ) : null}
              {event.starts_at ? (
                <InfoRow icon={<ClockIcon size={18} stroke="var(--color-accent-500)" />} title={`${formatTime(event.starts_at)} h`} note={event.time_note} />
              ) : null}
              {event.organizer ? (
                <InfoRow icon={<OrganizerIcon size={18} stroke="var(--color-accent-500)" />} title={t.boloDetail.organizedBy} note={event.organizer} />
              ) : null}
            </div>
            {event.description ? (
              <div
                className="rich-content"
                style={{ margin: "8px 0 0" }}
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            ) : null}
            {event.starts_at ? (
              <div style={{ marginTop: 4 }}>
                <AddToCalendarButton icsHref={icsHref} googleHref={googleHref} variant="button" />
              </div>
            ) : null}
          </Card>

          

          <AttendancePicker
            eventId={event.id}
            allowedRoles={event.allowed_roles}
            askCars={event.ask_cars}
            initialResponse={mine?.response ?? null}
            initialCar={mine?.brings_car ?? false}
            eventOptions={eventOptions}
            initialOptionResponses={myOptionResponses}
            allowMultipleOptions={event.allow_multiple_options}
          />

          {event.map_url ? (
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.boloDetail.route}</h3>
              <a href={event.map_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ height: 44 }}>
                Obre el recorregut
              </a>
            </div>
          ) : null}

          <SignupList signups={signups} total={totalMembers} />

          <CommentSection eventId={event.id} comments={comments} />

          {profile.is_admin ? (
            <AdminOnly>
              <BoloAdminSummary eventId={event.id} cells={summaryCells} />
              <BoloAttendanceAdmin
                eventId={event.id}
                allowedRoles={event.allowed_roles}
                allMembers={allMembers}
                signups={signups}
              />
              <BoloOptionsAdmin eventId={event.id} options={eventOptions} />
              <BoloFocEditor
                eventId={event.id}
                defaultTitle={event.title}
                memberNames={allMembers.map((m) => m.full_name)}
                diableNames={signups.filter((s) => s.response === "diable").map((s) => s.full_name)}
              />
            </AdminOnly>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}

function InfoRow({ icon, title, note }: { icon: React.ReactNode; title: string; note?: string | null }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
      <span style={{ marginTop: 2, flex: "none" }}>{icon}</span>
      <div>
        <strong>{title}</strong>
        {note ? <div style={{ opacity: 0.6, fontSize: 13 }}>{note}</div> : null}
      </div>
    </div>
  );
}
