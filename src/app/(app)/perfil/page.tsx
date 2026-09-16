import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileForm } from "@/components/members/ProfileForm";
import { ChangePasswordForm } from "@/components/members/ChangePasswordForm";
import { AvatarUpload } from "@/components/members/AvatarUpload";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMember, listMembers } from "@/lib/data/members";
import { signOut } from "@/app/(auth)/login/actions";
import { boardPositionLabel } from "@/lib/utils/labels";
import { Tag } from "@/components/ui/Tag";
import { t } from "@/i18n/t";
import type { BoloResponse } from "@/types/database";

export default async function PerfilPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [full, allMembers, attendanceResult, bolosResult] = await Promise.all([
    getMember(supabase, profile.id),
    listMembers(supabase),
    supabase
      .from("bolo_attendance")
      .select("response, event:event_id(starts_at)")
      .eq("member_id", profile.id),
    supabase
      .from("events")
      .select("starts_at")
      .eq("kind", "bolo"),
  ]);

  const joinedDate = full?.joined_date ?? null;

  const allBolos = (bolosResult.data ?? []).filter(
    (b) => !joinedDate || !b.starts_at || b.starts_at >= joinedDate,
  );
  const totalBolos = allBolos.length;

  const attendance = (attendanceResult.data ?? []).filter((a) => {
    const eventDate = (a.event as { starts_at: string | null } | null)?.starts_at ?? null;
    return !joinedDate || !eventDate || eventDate >= joinedDate;
  });

  const participated = attendance.filter(
    (a) => (["diable", "tabaler", "supporter"] as BoloResponse[]).includes(a.response as BoloResponse),
  ).length;
  const declined = attendance.filter((a) => a.response === "no").length;
  const noResponse = Math.max(0, totalBolos - attendance.length);

  return (
    <>
      <PageHeader kicker={t.profile.title} title={t.profile.title} userName={profile.full_name} />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AvatarUpload
              userId={profile.id}
              name={profile.full_name}
              currentUrl={(full ?? profile).avatar_url ?? null}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, textTransform: "uppercase" }}>{profile.full_name}</div>
              {profile.nickname ? <div style={{ fontSize: 14, color: "var(--color-accent-700)", marginTop: 2 }}>«{profile.nickname}»</div> : null}
              <div style={{ marginTop: 6 }}>
                <Tag variant="neutral">{boardPositionLabel(profile.board_position)}</Tag>
              </div>
            </div>
          </div>

          {/* Bolo stats */}
          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ fontSize: 20, margin: 0 }}>{t.profile.boloStats}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <StatCard
                label={t.profile.statsParticipated}
                value={participated}
                total={totalBolos}
                bg="rgba(34,197,94,.08)"
                color="#16a34a"
              />
              <StatCard
                label={t.profile.statsDeclined}
                value={declined}
                total={totalBolos}
                bg="rgba(239,68,68,.08)"
                color="#dc2626"
              />
              <StatCard
                label={t.profile.statsNoResponse}
                value={noResponse}
                total={totalBolos}
                bg="rgba(32,30,29,.05)"
                color="rgba(32,30,29,.45)"
              />
            </div>
            <div style={{ fontSize: 12, opacity: 0.45, textAlign: "center" }}>
              {t.profile.statsTotal(totalBolos)}
            </div>
          </section>

          <ProfileForm profile={full ?? profile} allMembers={allMembers} />

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

function StatCard({
  label, value, total, bg, color,
}: {
  label: string; value: number; total: number; bg: string; color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ background: bg, borderRadius: 20, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color }}>{value}</div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, color, opacity: 0.7 }}>{pct}%</div>
      <div style={{ fontSize: 11, color, opacity: 0.85, marginTop: 2, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}
