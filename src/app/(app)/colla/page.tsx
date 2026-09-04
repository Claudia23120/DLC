import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { CollaView } from "@/components/members/CollaView";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listMembers, getBoard, listMembersWithPadrins } from "@/lib/data/members";
import { listBadgesWithCounts } from "@/lib/data/badges";
import { t } from "@/i18n/t";

export default async function CollaPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [members, board, lineage, badgesWithCounts] = await Promise.all([
    listMembers(supabase),
    getBoard(supabase),
    listMembersWithPadrins(supabase),
    listBadgesWithCounts(supabase),
  ]);

  return (
    <>
      <PageHeader
        kicker={`${members.length} membres`}
        title={t.nav.colla}
        userName={profile.full_name}
      />
      <PageContainer>
        <CollaView
          board={board}
          members={members}
          isAdmin={profile.is_admin}
          lineage={lineage}
          badgesWithCounts={badgesWithCounts}
        />
      </PageContainer>
    </>
  );
}
