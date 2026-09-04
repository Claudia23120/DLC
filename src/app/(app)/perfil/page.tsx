import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileForm } from "@/components/members/ProfileForm";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMember, listMembers } from "@/lib/data/members";
import { signOut } from "@/app/(auth)/login/actions";
import { boardPositionLabel } from "@/lib/utils/labels";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { t } from "@/i18n/t";

export default async function PerfilPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [full, allMembers] = await Promise.all([
    getMember(supabase, profile.id),
    listMembers(supabase),
  ]);

  return (
    <>
      <PageHeader kicker={t.profile.title} title={t.profile.title} userName={profile.full_name} />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={profile.full_name} size={72} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, textTransform: "uppercase" }}>{profile.full_name}</div>
              {profile.nickname ? <div style={{ fontSize: 14, color: "var(--color-accent-700)", marginTop: 2 }}>«{profile.nickname}»</div> : null}
              <div style={{ marginTop: 6 }}>
                <Tag variant="neutral">{boardPositionLabel(profile.board_position)}</Tag>
              </div>
            </div>
          </div>

          <ProfileForm profile={full ?? profile} allMembers={allMembers} />

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
