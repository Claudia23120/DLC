import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { BolosView } from "@/components/bolos/BolosView";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/data/events";
import { t } from "@/i18n/t";

export default async function BolosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const events = await listEvents(supabase, profile.id);
  const firstName = profile.full_name.split(" ")[0];

  return (
    <>
      <PageHeader
        kicker={t.bolos.title}
        title={`${t.bolos.greeting}, ${firstName}`}
        userName={profile.full_name}
      />
      <PageContainer>
        <BolosView events={events} isAdmin={profile.is_admin} />
      </PageContainer>
    </>
  );
}
