import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { JuntaView } from "@/components/junta/JuntaView";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listEventsLight } from "@/lib/data/events";
import { listAllMembersForAdmin } from "@/lib/data/members";
import { listSongs } from "@/lib/data/songs";
import { listCommissions, listCurrentCommissions } from "@/lib/data/commissions";
import { t } from "@/i18n/t";
import type { JuntaStats } from "@/components/junta/JuntaView";

export default async function JuntaPage({
  searchParams,
}: {
  searchParams: Promise<{ any?: string }>;
}) {
  const { any } = await searchParams;
  const profile = await requireAdmin();
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const [events, members, quotaResult, songs, current] = await Promise.all([
    listEventsLight(supabase, profile.id),
    listAllMembersForAdmin(supabase),
    supabase
      .from("quota_payments")
      .select("member_id, paid, installments_paid")
      .eq("year", currentYear),
    listSongs(supabase),
    listCurrentCommissions(supabase),
  ]);

  // Commissions tab: any year from the first one up to next year (?any=YYYY).
  const requestedYear = Number(any);
  const commissionsYear = Number.isInteger(requestedYear)
    ? Math.min(Math.max(requestedYear, current.firstYear), current.year + 1)
    : current.year;
  const commissions = commissionsYear === current.year
    ? current.commissions
    : await listCommissions(supabase, commissionsYear);

  // Hides the "duplicate for next year" button once next year has commissions.
  const { count: nextYearCount } = await supabase
    .from("commissions")
    .select("id", { count: "exact", head: true })
    .eq("year", current.year + 1);

  const activeMembers = members.filter((m) => m.member_status === "active" || m.member_status === "active_without_quota");
  const bolosThisYear = events.filter((e) => {
    if (e.kind !== "bolo") return false;
    if (!e.starts_at) return false;
    return new Date(e.starts_at).getFullYear() === currentYear;
  });
  const totalBoloAttendance = bolosThisYear.reduce((sum, e) => sum + (e.counts.signup_count ?? 0), 0);
  const avgAttendance = bolosThisYear.length > 0
    ? Math.round(totalBoloAttendance / bolosThisYear.length)
    : 0;

  const stats: JuntaStats = {
    activeCount: activeMembers.length,
    inactiveCount: members.filter((m) => m.member_status === "inactive").length,
    quotaPaidCount: quotaResult.data?.filter((r) => r.paid).length ?? 0,
    totalMembersForQuota: activeMembers.filter((m) => m.member_status === "active").length,
    bolosThisYear: bolosThisYear.length,
    avgAttendance,
  };

  const quotaRows = quotaResult.data ?? [];

  return (
    <>
      <PageHeader kicker={t.common.onlyBoard} title={t.junta.title} userName={profile.full_name} />
      <PageContainer>
        <JuntaView
          events={events}
          members={members}
          stats={stats}
          quotaYear={currentYear}
          quotaRows={quotaRows}
          songs={songs}
          commissionsYear={commissionsYear}
          commissionsCurrentYear={current.year}
          commissionsFirstYear={current.firstYear}
          nextYearHasCommissions={(nextYearCount ?? 0) > 0}
          commissions={commissions}
        />
      </PageContainer>
    </>
  );
}
