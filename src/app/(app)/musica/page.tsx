import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { MusicaView } from "@/components/musica/MusicaView";
import { requireProfile } from "@/lib/auth/session";
import { t } from "@/i18n/t";

export default async function MusicaPage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader kicker="Instruments i temes" title={t.nav.musica} userName={profile.full_name} />
      <PageContainer>
        <MusicaView />
      </PageContainer>
    </>
  );
}
