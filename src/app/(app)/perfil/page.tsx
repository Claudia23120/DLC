import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileForm } from "@/components/members/ProfileForm";
import { ChangePasswordForm } from "@/components/members/ChangePasswordForm";
import { AvatarUpload } from "@/components/members/AvatarUpload";
import { BoloStatsSection } from "@/components/members/BoloStatsSection";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMemberPrivate, listMembers } from "@/lib/data/members";
import { getBoloStats } from "@/lib/data/bolo-stats";
import { signOut } from "@/app/(auth)/login/actions";
import { boardPositionLabel } from "@/lib/utils/labels";
import { Tag } from "@/components/ui/Tag";
import { t } from "@/i18n/t";

export default async function PerfilPage() {
  // requireProfile already loads the full row (memoized per request).
  const profile = await requireProfile();
  const supabase = await createClient();

  const [privateData, allMembers, stats] = await Promise.all([
    getMemberPrivate(supabase, profile.id),
    listMembers(supabase),
    getBoloStats(supabase, profile.id, profile.joined_date),
  ]);

  return (
    <>
      <PageHeader kicker={t.profile.title} title={t.profile.title} userName={profile.full_name} />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AvatarUpload
              userId={profile.id}
              name={profile.full_name}
              currentUrl={profile.avatar_url ?? null}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, textTransform: "uppercase" }}>{profile.full_name}</div>
              {profile.nickname ? <div style={{ fontSize: 14, color: "var(--color-accent-700)", marginTop: 2 }}>«{profile.nickname}»</div> : null}
              <div style={{ marginTop: 6 }}>
                <Tag variant="neutral">{boardPositionLabel(profile.board_position)}</Tag>
              </div>
            </div>
          </div>

          <BoloStatsSection stats={stats} hasJoinedDate={!!profile.joined_date} />

          <ProfileForm profile={profile} privateData={privateData} allMembers={allMembers} />

          <ChangePasswordForm />

          <form action={signOut}>
            <button type="submit" className="btn btn-secondary btn-block" style={{ height: 48 }}>
              {t.auth.signOut}
            </button>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
