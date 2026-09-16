import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { JuntaView } from "@/components/junta/JuntaView";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/data/events";
import { listAllMembersForAdmin } from "@/lib/data/members";
import { t } from "@/i18n/t";
import type { JuntaStats } from "@/components/junta/JuntaView";

export default async function JuntaPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const [events, members, quotaResult] = await Promise.all([
    listEvents(supabase, profile.id),
    listAllMembersForAdmin(supabase),
    supabase
      .from("quota_payments")
      .select("member_id")
      .eq("year", currentYear)
      .eq("paid", true),
  ]);

  const activeMembers = members.filter((m) => m.member_status === "active");
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
    intermittentCount: members.filter((m) => m.member_status === "intermittent").length,
    quotaPaidCount: quotaResult.data?.length ?? 0,
    totalMembersForQuota: activeMembers.length,
    bolosThisYear: bolosThisYear.length,
    avgAttendance,
  };

  const quotaPaidIds = quotaResult.data?.map((r) => r.member_id) ?? [];

  return (
    <>
      <PageHeader kicker={t.common.onlyBoard} title={t.junta.title} userName={profile.full_name} />
      <PageContainer>
        <JuntaView
          events={events}
          members={members}
          stats={stats}
          quotaYear={currentYear}
          quotaPaidIds={quotaPaidIds}
        />
      </PageContainer>
    </>
  );
}
