import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { AdminOnly } from "@/components/ui/AdminOnly";
import { BadgeGrid } from "@/components/members/BadgeGrid";
import { BoloStatsSection } from "@/components/members/BoloStatsSection";
import { FactCard, FactRow, FactTable } from "@/components/members/FactTable";
import { MemberAdminPanel } from "@/components/members/MemberAdminPanel";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getFillols, getMemberPrivate, getMemberWithPadrins } from "@/lib/data/members";
import { getMemberBadges, listBadgesWithCounts } from "@/lib/data/badges";
import { getBoloStats } from "@/lib/data/bolo-stats";
import { boardPositionLabel } from "@/lib/utils/labels";
import { saveJoinedDate } from "./actions";
import { t } from "@/i18n/t";

interface PageProps {
  params: Promise<{ id: string }>;
}

const LINK_STYLE = { color: "var(--color-accent-700)", textDecoration: "none" } as const;

/** Dates come as `YYYY-MM-DD`; format them as that calendar day, not shifted by timezone. */
function formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("ca", { ...options, timeZone: "UTC" });
}

function sizeText(ownSuit: unknown, size: unknown): string {
  if (ownSuit === true) return t.member.ownSuit;
  return typeof size === "string" && size.length ? size : "—";
}

export default async function MemberPage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await requireProfile();
  const supabase = await createClient();
  const isAdmin = viewer.is_admin;
  const canSeePrivate = isAdmin || viewer.id === id;
  const canEditJoinedDate = canSeePrivate; // the board and the member themselves

  const [member, fillols, memberBadges, allBadges, privateData, quotaResult] = await Promise.all([
    getMemberWithPadrins(supabase, id),
    getFillols(supabase, id),
    getMemberBadges(supabase, id),
    listBadgesWithCounts(supabase),
    canSeePrivate ? getMemberPrivate(supabase, id) : Promise.resolve(null),
    isAdmin
      ? createServiceRoleClient().from("quota_payments").select("year, paid").eq("member_id", id).order("year")
      : Promise.resolve({ data: [] as { year: number; paid: boolean }[] }),
  ]);
  if (!member) notFound();

  const stats = isAdmin ? await getBoloStats(supabase, id, member.joined_date) : null;
  const quotaPayments: Record<number, boolean> = Object.fromEntries(
    (quotaResult.data ?? []).map((r) => [r.year, r.paid]),
  );

  const sizes = member.sizes as Record<string, unknown>;
  const facts: { label: string; value: string }[] = [
    { label: t.profile.phone, value: member.phone ?? "—" },
    { label: t.profile.email, value: member.email },
  ];
  if (member.birth_date) {
    facts.push({ label: t.profile.birthDate, value: formatDate(member.birth_date, { day: "numeric", month: "long" }) });
  }
  if (canSeePrivate) {
    facts.push({ label: t.profile.emergencyContact, value: privateData?.emergency_contact ?? "—" });
  }
  facts.push({ label: t.profile.medicalNotes, value: member.medical_notes ?? "—" });

  const sizeRows = [
    { label: t.profile.casaca, value: sizeText(sizes.own_suit_foc, sizes.casaca) },
    { label: t.profile.pantalo, value: sizeText(sizes.own_suit_foc, sizes.pantalo) },
    { label: t.profile.tabalerPant, value: sizeText(sizes.own_suit_tabaler, sizes.tabaler) },
  ].filter((r) => r.value !== "—");

  const memberLink = (m: { id: string; full_name: string }) => (
    <Link href={`/membres/${m.id}`} style={LINK_STYLE}>{m.full_name}</Link>
  );
  const hasGodparents = member.padri_foc || member.padri_tabal || fillols.length > 0;
  const manualBadges = allBadges.filter((b) => b.type === "manual" || b.type === "repte");
  const earnedBadgeIds = new Set(memberBadges.map((mb) => mb.badge_id));

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
              {member.joined_date ? (
                <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>
                  {t.member.memberSince(formatDate(member.joined_date, { day: "numeric", month: "long", year: "numeric" }))}
                </div>
              ) : null}
            </div>
          </div>

          {member.board_position ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag variant="accent">{boardPositionLabel(member.board_position)}</Tag>
            </div>
          ) : null}

          {member.bio ? <p style={{ fontSize: 14, margin: 0 }}>{member.bio}</p> : null}

          {stats && stats.total > 0 ? <BoloStatsSection stats={stats} hasJoinedDate={!!member.joined_date} /> : null}

          {hasGodparents ? (
            <FactCard title={t.member.godparents}>
              {member.padri_foc ? <FactRow label={t.member.godparentFoc}>{memberLink(member.padri_foc)}</FactRow> : null}
              {member.padri_tabal ? <FactRow label={t.member.godparentTabal}>{memberLink(member.padri_tabal)}</FactRow> : null}
              {fillols.map((f) => (
                <FactRow key={`${f.id}-${f.role}`} label={f.role === "foc" ? t.member.godchildFoc : t.member.godchildTabal}>
                  {memberLink(f)}
                </FactRow>
              ))}
            </FactCard>
          ) : null}

          {memberBadges.length > 0 ? (
            <div>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.badges}</h3>
              <BadgeGrid badges={memberBadges} />
            </div>
          ) : null}

          <FactTable title={t.member.contact} rows={facts} />
          {sizeRows.length ? <FactTable title={t.member.sizes} rows={sizeRows} /> : null}

          <div>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.joinedDate}</h3>
            {canEditJoinedDate ? (
              <form action={saveJoinedDate.bind(null, id)} style={{ display: "flex", gap: 8 }}>
                <input
                  type="date"
                  name="joined_date"
                  aria-label={t.member.joinedDate}
                  defaultValue={member.joined_date?.slice(0, 10) ?? ""}
                  className="input"
                  style={{ height: 44 }}
                />
                <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 18px" }}>
                  {t.member.saveShort}
                </button>
              </form>
            ) : (
              <input
                type="date"
                aria-label={t.member.joinedDate}
                defaultValue={member.joined_date?.slice(0, 10) ?? ""}
                className="input"
                style={{ height: 44 }}
                readOnly
                disabled
              />
            )}
          </div>

          {isAdmin ? (
            <AdminOnly>
              <MemberAdminPanel
                member={member}
                manualBadges={manualBadges}
                earnedBadgeIds={earnedBadgeIds}
                quotaPayments={quotaPayments}
              />
            </AdminOnly>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}
