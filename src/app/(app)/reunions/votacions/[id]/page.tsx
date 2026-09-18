import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ClockIcon } from "@/components/ui/icons";
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
  const total = memberCount ?? 0;

  return (
    <>
      <PageHeader
        kicker={t.kinds.votacio}
        title={event.title}
        showBack
        userName={profile.full_name}
      />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Info card */}
          <Card style={{ padding: 18, gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag
                variant="custom"
                bg={KIND_META.votacio.bg}
                color={KIND_META.votacio.color}
              >
                {t.kinds.votacio}
              </Tag>
              <Tag variant={closed ? "neutral" : "accent"}>
                {closed ? t.polls.closed : t.polls.open}
              </Tag>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {event.closes_at ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
                  <span style={{ flex: "none" }}>
                    <ClockIcon size={18} stroke="var(--color-accent-500)" />
                  </span>
                  <span>
                    {closed
                      ? `Tancada el ${formatLongDate(event.closes_at)}`
                      : `Oberta fins al ${formatLongDate(event.closes_at)}`}
                  </span>
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, opacity: 0.6 }}>
                <span style={{ flex: "none", width: 18, textAlign: "center" }}>🗳</span>
                <span>
                  {results.total === 0
                    ? "Encara ningú ha votat"
                    : `${results.total} de ${total} ${total === 1 ? "membre ha votat" : "membres han votat"}`}
                </span>
              </div>
            </div>
          </Card>

          {/* Voting */}
          <PollVoting
            eventId={event.id}
            options={results.options}
            closed={closed}
            allowMultiple={event.allow_multiple_votes ?? false}
          />

          <CommentSection eventId={event.id} comments={comments} />
        </div>
      </PageContainer>
    </>
  );
}
