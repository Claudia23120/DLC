import { t } from "@/i18n/t";
import type { BoloStats } from "@/lib/data/bolo-stats";
import { Grid } from "@/components/ui/Layout";

/** Participated / declined / no-response cards for a member's bolos. */
export function BoloStatsSection({ stats, hasJoinedDate }: { stats: BoloStats; hasJoinedDate: boolean }) {
  const { participated, declined, noResponse, total } = stats;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontSize: 20, margin: 0 }}>{t.profile.boloStats}</h3>
      <Grid cols={3} gap={8}>
        <StatCard label={t.profile.statsParticipated} value={participated} total={total} bg="rgba(34,197,94,.08)" color="#16a34a" />
        <StatCard label={t.profile.statsDeclined} value={declined} total={total} bg="rgba(239,68,68,.08)" color="#dc2626" />
        <StatCard label={t.profile.statsNoResponse} value={noResponse} total={total} bg="rgba(32,30,29,.05)" color="rgba(32,30,29,.45)" />
      </Grid>
      <div style={{ fontSize: 12, opacity: 0.45, textAlign: "center" }}>
        {hasJoinedDate ? t.profile.statsTotal(total) : t.profile.statsTotalNoJoin(total)}
      </div>
    </section>
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
