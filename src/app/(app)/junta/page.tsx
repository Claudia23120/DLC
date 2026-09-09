import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { JuntaView } from "@/components/junta/JuntaView";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/data/events";
import { listAllMembersForAdmin } from "@/lib/data/members";
import { t } from "@/i18n/t";

export default async function JuntaPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [events, members] = await Promise.all([
    listEvents(supabase, profile.id),
    listAllMembersForAdmin(supabase),
  ]);

  return (
    <>
      <PageHeader kicker={t.common.onlyBoard} title={t.junta.title} userName={profile.full_name} />
      <PageContainer>
        <JuntaView events={events} members={members} />
      </PageContainer>
    </>
  );
}
