import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { PollVoting } from "@/components/polls/PollVoting";
import { CommentSection } from "@/components/bolos/CommentSection";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getComments } from "@/lib/data/events";
import { getPollResults } from "@/lib/data/polls";
import { eventDetailHref, KIND_META } from "@/lib/domain/events";
import { isPast, formatLongDate } from "@/lib/utils/dates";
import { t } from "@/i18n/t";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PollDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const event = await getEvent(supabase, id);
  if (!event) notFound();
  if (event.kind !== "votacio") redirect(eventDetailHref(event.id, event.kind));

  const [results, comments, { count: memberCount }] = await Promise.all([
    getPollResults(supabase, id, profile.id),
    getComments(supabase, id),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const closed = event.closes_at ? isPast(event.closes_at) : false;
  const meta = closed
    ? `${t.polls.closed} · ${results.total} vots`
    : `${event.closes_at ? `Oberta fins al ${formatLongDate(event.closes_at)}` : t.polls.open} · ${results.total} de ${memberCount ?? 0} vots`;

  return (
    <>
      <PageHeader kicker={t.kinds.votacio} title={event.title} showBack userName={profile.full_name} />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 18, gap: 10 }}>
            <Tag variant="custom" bg={KIND_META.votacio.bg} color={KIND_META.votacio.color} style={{ alignSelf: "flex-start" }}>
              {closed ? t.polls.closed : t.polls.open}
            </Tag>
            <div className="card-title" style={{ fontSize: 20, marginTop: 6 }}>{event.title}</div>
            <div style={{ fontSize: 13, opacity: 0.6 }}>{meta}</div>
            {event.description ? <p style={{ fontSize: 14, margin: "8px 0 0" }}>{event.description}</p> : null}
          </Card>

          <PollVoting eventId={event.id} options={results.options} closed={closed} />

          <CommentSection eventId={event.id} comments={comments} />
        </div>
      </PageContainer>
    </>
  );
}
