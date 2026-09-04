import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { BadgeGrid } from "@/components/members/BadgeGrid";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getMemberWithPadrins, getFillols } from "@/lib/data/members";
import { getMemberBadges, listBadgesWithCounts } from "@/lib/data/badges";
import { RESPONSE_META } from "@/lib/domain/events";
import { boardPositionLabel } from "@/lib/utils/labels";
import { grantBadgeAction, revokeBadgeAction } from "@/app/(app)/colla/badge-actions";
import { revalidatePath } from "next/cache";
import { t } from "@/i18n/t";
import type { MemberRole } from "@/types/database";
import Link from "next/link";
import type { ReactNode } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberPage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await requireProfile();
  const supabase = await createClient();

  const [member, fillols, memberBadges, allBadges] = await Promise.all([
    getMemberWithPadrins(supabase, id),
    getFillols(supabase, id),
    getMemberBadges(supabase, id),
    listBadgesWithCounts(supabase),
  ]);

  if (!member) notFound();

  const sizes = member.sizes as Record<string, unknown>;
  const facts: { label: string; value: string }[] = [
    { label: t.profile.phone, value: (member.phone as string) ?? "—" },
    { label: t.profile.email, value: member.email },
    { label: t.profile.emergencyContact, value: (member.emergency_contact as string) ?? "—" },
    { label: t.profile.medicalNotes, value: (member.medical_notes as string) ?? "—" },
  ];
  const sizeRows: { label: string; value: string }[] = [
    { label: t.profile.casaca, value: sizeText(sizes.own_suit_foc, sizes.casaca) },
    { label: t.profile.pantalo, value: sizeText(sizes.own_suit_foc, sizes.pantalo) },
    { label: t.profile.tabalerPant, value: sizeText(sizes.own_suit_tabaler, sizes.tabaler) },
  ].filter((r) => r.value !== "—");

  const hasPadrins = member.padri_foc || member.padri_tabal;
  const hasFillols = fillols.length > 0;
  const manualBadges = allBadges.filter((b) => b.type === "manual" || b.type === "repte");
  const earnedIds = new Set(memberBadges.map((mb) => mb.badge_id));

  async function saveJoinedYear(fd: FormData) {
    "use server";
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return;
    const { data: me } = await authClient.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!me?.is_admin) return;
    const y = parseInt(String(fd.get("joined_year") ?? ""), 10);
    if (!isNaN(y) && y > 1990 && y <= new Date().getFullYear()) {
      const admin = createServiceRoleClient();
      await admin.from("profiles").update({ joined_year: y }).eq("id", id);
    }
    revalidatePath(`/membres/${id}`);
  }

  return (
    <>
      <PageHeader kicker={t.nav.colla} title={t.member.title} showBack userName={viewer.full_name} />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={member.full_name} size={72} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, textTransform: "uppercase", lineHeight: 1.05 }}>
                {member.full_name}
              </div>
              {member.nickname ? <div style={{ fontSize: 14, color: "var(--color-accent-700)", marginTop: 2 }}>«{member.nickname}»</div> : null}
              {member.role_title ? <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{member.role_title}</div> : null}
              {member.joined_year ? <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>Membre des de {member.joined_year}</div> : null}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {member.board_position ? <Tag variant="accent">{boardPositionLabel(member.board_position)}</Tag> : null}
            {(member.member_roles as MemberRole[]).map((r) => (
              <Tag key={r} variant="custom" bg={RESPONSE_META[r].bg} color={RESPONSE_META[r].color}>{RESPONSE_META[r].label}</Tag>
            ))}
          </div>

          {member.bio ? <p style={{ fontSize: 14, margin: 0 }}>{member.bio}</p> : null}

          {(hasPadrins || hasFillols) ? (
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.godparents}</h3>
              <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 16px" }}>
                {member.padri_foc ? (
                  <FactRow label="Padrí/madrina de foc">
                    <Link href={`/membres/${member.padri_foc.id}`} style={{ color: "var(--color-accent-700)", textDecoration: "none" }}>
                      {member.padri_foc.full_name}
                    </Link>
                  </FactRow>
                ) : null}
                {member.padri_tabal ? (
                  <FactRow label="Padrí/madrina de tabal">
                    <Link href={`/membres/${member.padri_tabal.id}`} style={{ color: "var(--color-accent-700)", textDecoration: "none" }}>
                      {member.padri_tabal.full_name}
                    </Link>
                  </FactRow>
                ) : null}
                {fillols.map((f) => (
                  <FactRow key={`${f.id}-${f.role}`} label={f.role === "foc" ? "Fillol/a de foc" : "Fillol/a de tabal"}>
                    <Link href={`/membres/${f.id}`} style={{ color: "var(--color-accent-700)", textDecoration: "none" }}>
                      {f.full_name}
                    </Link>
                  </FactRow>
                ))}
              </div>
            </div>
          ) : null}

          {memberBadges.length > 0 ? (
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.badges}</h3>
              <BadgeGrid badges={memberBadges} />
            </div>
          ) : null}

          {viewer.is_admin && manualBadges.length > 0 ? (
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.assignBadges}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {manualBadges.map((b) => {
                  const hasIt = earnedIds.has(b.id);
                  const action = hasIt
                    ? revokeBadgeAction.bind(null, id, b.id)
                    : grantBadgeAction.bind(null, id, b.id);
                  return (
                    <form key={b.id} action={action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--color-surface)", borderRadius: 20, boxShadow: "var(--shadow-sm)" }}>
                      <span style={{ fontSize: 22 }}>{b.icon}</span>
                      <span style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: 14 }}>{b.name}</span>
                      <button type="submit" className={hasIt ? "btn btn-secondary" : "btn btn-primary"} style={{ height: 36, fontSize: 13, padding: "0 14px" }}>
                        {hasIt ? "Revoca" : "Atorga"}
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          ) : null}

          <FactTable title={t.member.contact} rows={facts} />
          {sizeRows.length ? <FactTable title={t.member.sizes} rows={sizeRows} /> : null}

          {viewer.is_admin ? (
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>Any d&apos;entrada (admin)</h3>
              <form action={saveJoinedYear} style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  name="joined_year"
                  defaultValue={member.joined_year ?? ""}
                  min={1991}
                  max={new Date().getFullYear()}
                  className="input"
                  style={{ height: 44, width: 100 }}
                  placeholder="Any"
                />
                <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 18px" }}>
                  Desa
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}

function sizeText(ownSuit: unknown, size: unknown): string {
  if (ownSuit === true) return "Vestit propi";
  return typeof size === "string" && size.length ? size : "—";
}

function FactTable({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div>
      <h3 style={{ fontSize: 20, marginBottom: 10 }}>{title}</h3>
      <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 16px" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
            <span style={{ fontSize: 13, opacity: 0.55, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 14 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
      <span style={{ fontSize: 13, opacity: 0.55, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{children}</span>
    </div>
  );
}
