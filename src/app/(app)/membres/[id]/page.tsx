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
import { boardPositionLabel } from "@/lib/utils/labels";
import { AdminOnly } from "@/components/ui/AdminOnly";
import { grantBadgeAction, revokeBadgeAction } from "@/app/(app)/colla/badge-actions";
import { revalidatePath } from "next/cache";
import { t } from "@/i18n/t";
import type { BoloResponse, MemberStatus } from "@/types/database";
import Link from "next/link";
import type { ReactNode } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberPage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await requireProfile();
  const supabase = await createClient();

  const adminClient = viewer.is_admin ? createServiceRoleClient() : null;

  const [member, fillols, memberBadges, allBadges, quotaPaymentsResult, attendanceResult, bolosResult] = await Promise.all([
    getMemberWithPadrins(supabase, id),
    getFillols(supabase, id),
    getMemberBadges(supabase, id),
    listBadgesWithCounts(supabase),
    adminClient
      ? adminClient.from("quota_payments").select("year, paid").eq("member_id", id).order("year")
      : Promise.resolve({ data: [] }),
    viewer.is_admin
      ? supabase.from("bolo_attendance").select("response, event:event_id(starts_at)").eq("member_id", id)
      : Promise.resolve({ data: [] }),
    viewer.is_admin
      ? supabase.from("events").select("starts_at").eq("kind", "bolo")
      : Promise.resolve({ data: [] }),
  ]);

  const quotaPayments: Record<number, boolean> = Object.fromEntries(
    (quotaPaymentsResult.data ?? []).map((r) => [r.year, r.paid])
  );

  const joinedDate = member?.joined_date ?? null;
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

  if (!member) notFound();

  const sizes = member.sizes as Record<string, unknown>;
  const facts: { label: string; value: string }[] = [
    { label: t.profile.phone, value: (member.phone as string) ?? "—" },
    { label: t.profile.email, value: member.email },
    member.birth_date
      ? { label: t.profile.birthDate, value: new Date(member.birth_date).toLocaleDateString("ca", { day: "numeric", month: "long" }) }
      : null,
    { label: t.profile.emergencyContact, value: (member.emergency_contact as string) ?? "—" },
    { label: t.profile.medicalNotes, value: (member.medical_notes as string) ?? "—" },
  ].filter(Boolean) as { label: string; value: string }[];
  const sizeRows: { label: string; value: string }[] = [
    { label: t.profile.casaca, value: sizeText(sizes.own_suit_foc, sizes.casaca) },
    { label: t.profile.pantalo, value: sizeText(sizes.own_suit_foc, sizes.pantalo) },
    { label: t.profile.tabalerPant, value: sizeText(sizes.own_suit_tabaler, sizes.tabaler) },
  ].filter((r) => r.value !== "—");

  const hasPadrins = member.padri_foc || member.padri_tabal;
  const hasFillols = fillols.length > 0;
  const manualBadges = allBadges.filter((b) => b.type === "manual" || b.type === "repte");
  const earnedIds = new Set(memberBadges.map((mb) => mb.badge_id));

  async function saveJoinedDate(fd: FormData) {
    "use server";
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return;
    const { data: me } = await authClient.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!me?.is_admin && user.id !== id) return;
    const raw = String(fd.get("joined_date") ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const year = parseInt(raw.slice(0, 4), 10);
      const admin = createServiceRoleClient();
      await admin.from("profiles").update({ joined_date: raw, joined_year: year }).eq("id", id);
    }
    revalidatePath(`/membres/${id}`);
  }

  async function saveAdminFields(fd: FormData) {
    "use server";
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return;
    const { data: me } = await authClient.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!me?.is_admin) return;
    const status = String(fd.get("member_status") ?? "") as MemberStatus;
    const validStatuses: MemberStatus[] = ["active", "inactive", "intermittent"];
    if (!validStatuses.includes(status)) return;
    const boardPositionRaw = String(fd.get("board_position") ?? "").trim();
    const validPositions = ["presidenta", "vicepresidenta", "secretaria", "tresorera", "cap_de_foc", "cap_de_tabals"];
    const boardPosition = validPositions.includes(boardPositionRaw) ? boardPositionRaw : null;
    const admin = createServiceRoleClient();
    await admin.from("profiles").update({
      member_status: status,
      board_position: boardPosition,
      has_cre: fd.get("has_cre") === "on",
      has_rgcre: fd.get("has_rgcre") === "on",
      quota_automatic: fd.get("quota_automatic") === "on",
    }).eq("id", id);
    revalidatePath(`/membres/${id}`);
    revalidatePath("/colla");
    revalidatePath("/junta");
  }

  async function saveQuotaPayments(fd: FormData) {
    "use server";
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return;
    const { data: me } = await authClient.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!me?.is_admin) return;
    const yearsRaw = String(fd.get("years") ?? "");
    const years = yearsRaw.split(",").map(Number).filter(Boolean);
    const admin = createServiceRoleClient();
    await admin.from("quota_payments").upsert(
      years.map((year) => ({
        member_id: id,
        year,
        paid: fd.get(`paid_${year}`) === "on",
      })),
      { onConflict: "member_id,year" }
    );
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
              {member.joined_date ? <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>Membre des de {new Date(member.joined_date).toLocaleDateString("ca", { day: "numeric", month: "long", year: "numeric" })}</div> : null}
            </div>
          </div>

          {member.board_position ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag variant="accent">{boardPositionLabel(member.board_position)}</Tag>
            </div>
          ) : null}

          {member.bio ? <p style={{ fontSize: 14, margin: 0 }}>{member.bio}</p> : null}

          {viewer.is_admin && totalBolos > 0 ? (
            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h3 style={{ fontSize: 20, margin: 0 }}>{t.profile.boloStats}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <StatCard label={t.profile.statsParticipated} value={participated} total={totalBolos} bg="rgba(34,197,94,.08)" color="#16a34a" />
                <StatCard label={t.profile.statsDeclined} value={declined} total={totalBolos} bg="rgba(239,68,68,.08)" color="#dc2626" />
                <StatCard label={t.profile.statsNoResponse} value={noResponse} total={totalBolos} bg="rgba(32,30,29,.05)" color="rgba(32,30,29,.45)" />
              </div>
              <div style={{ fontSize: 12, opacity: 0.45, textAlign: "center" }}>
                {joinedDate ? t.profile.statsTotal(totalBolos) : `${totalBolos} bolos publicats en total`}
              </div>
            </section>
          ) : null}

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

          <FactTable title={t.member.contact} rows={facts} />
          {sizeRows.length ? <FactTable title={t.member.sizes} rows={sizeRows} /> : null}

          <div>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>Data d&apos;entrada</h3>
            <form action={saveJoinedDate} style={{ display: "flex", gap: 8 }}>
              <input
                type="date"
                name="joined_date"
                defaultValue={member.joined_date?.slice(0, 10) ?? ""}
                className="input"
                style={{ height: 44 }}
              />
              <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 18px" }}>
                Desa
              </button>
            </form>
          </div>

          {viewer.is_admin ? (
            <AdminOnly>
              {manualBadges.length > 0 ? (
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

              <div>
                <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.adminSection}</h3>
                <form action={saveAdminFields} style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "16px" }}>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, display: "block", marginBottom: 6 }}>
                      {t.member.memberStatus}
                    </label>
                    <select name="member_status" className="input" defaultValue={member.member_status} style={{ height: 44 }}>
                      <option value="active">{t.member.statusActive}</option>
                      <option value="inactive">{t.member.statusInactive}</option>
                      <option value="intermittent">{t.member.statusIntermittent}</option>
                    </select>
                  </div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, display: "block", marginBottom: 6 }}>
                      Posició a la junta
                    </label>
                    <select name="board_position" className="input" defaultValue={member.board_position ?? ""} style={{ height: 44 }}>
                      <option value="">Membre (sense càrrec)</option>
                      <option value="presidenta">Presidenta</option>
                      <option value="vicepresidenta">Vicepresidenta</option>
                      <option value="secretaria">Secretària</option>
                      <option value="tresorera">Tresorera</option>
                      <option value="cap_de_foc">Cap de Foc</option>
                      <option value="cap_de_tabals">Cap de Tabals</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
                      <input type="checkbox" name="has_cre" defaultChecked={member.has_cre} style={{ width: 18, height: 18 }} />
                      {t.member.hasCre}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
                      <input type="checkbox" name="has_rgcre" defaultChecked={member.has_rgcre} style={{ width: 18, height: 18 }} />
                      {t.member.hasRgcre}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
                      <input type="checkbox" name="quota_automatic" defaultChecked={member.quota_automatic} style={{ width: 18, height: 18 }} />
                      {t.member.quotaAutomatic}
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 18px" }}>
                    {t.common.save}
                  </button>
                </form>
              </div>

              {!member.quota_automatic ? (
                <QuotaPaymentsSection
                  joinedYear={member.joined_date ? new Date(member.joined_date).getFullYear() : null}
                  payments={quotaPayments}
                  action={saveQuotaPayments}
                />
              ) : null}
            </AdminOnly>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}

function StatCard({ label, value, total, bg, color }: { label: string; value: number; total: number; bg: string; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ background: bg, borderRadius: 20, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color }}>{value}</div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, color, opacity: 0.7 }}>{pct}%</div>
      <div style={{ fontSize: 11, color, opacity: 0.85, marginTop: 2, lineHeight: 1.2 }}>{label}</div>
    </div>
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

function QuotaPaymentsSection({
  joinedYear,
  payments,
  action,
}: {
  joinedYear: number | null;
  payments: Record<number, boolean>;
  action: (fd: FormData) => Promise<void>;
}) {
  const currentYear = new Date().getFullYear();
  const startYear = joinedYear ?? currentYear - 4;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div>
      <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.member.quotaSection}</h3>
      <form action={action} style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 16px 16px" }}>
        <input type="hidden" name="years" value={years.join(",")} />
        {years.map((year) => {
          const paid = payments[year] ?? false;
          return (
            <div key={year} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
              <span style={{ fontSize: 14, flex: 1, fontVariantNumeric: "tabular-nums" }}>{year}</span>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" name={`paid_${year}`} defaultChecked={paid} style={{ width: 18, height: 18 }} />
                <span style={{ color: paid ? "var(--color-accent-600)" : "rgba(32,30,29,.45)" }}>
                  {paid ? t.member.quotaPaid : t.member.quotaUnpaid}
                </span>
              </label>
            </div>
          );
        })}
        <button type="submit" className="btn btn-primary" style={{ height: 44, padding: "0 18px", marginTop: 12 }}>
          {t.member.quotaSave}
        </button>
      </form>
    </div>
  );
}
