import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { SongPlayer, PendingScore } from "@/components/musica/SongPlayer";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSongBySlug } from "@/lib/data/songs";
import { t } from "@/i18n/t";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SongDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const song = await getSongBySlug(supabase, slug);
  if (!song) notFound();

  return (
    <>
      <PageHeader
        kicker={song.kind ?? t.nav.musica}
        title={song.title}
        showBack
        userName={profile.full_name}
      />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(song.tempo || song.kind) && (
            <div style={{ display: "flex", gap: 12, fontSize: 13, opacity: 0.65 }}>
              {song.kind && <span>{song.kind}</span>}
              {song.tempo && <span>♩ = {song.tempo}</span>}
            </div>
          )}
          {song.gp_url ? <SongPlayer gpUrl={song.gp_url} /> : <PendingScore />}
        </div>
      </PageContainer>
    </>
  );
}
