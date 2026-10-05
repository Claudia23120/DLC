import { t } from "@/i18n/t";
import type { JuntaStats } from "./JuntaView";
import { Grid } from "@/components/ui/Layout";

export function JuntaStatsBar({ stats }: { stats: JuntaStats }) {
  const currentYear = new Date().getFullYear();
  const items = [
    { label: t.junta.statsActive, value: `${stats.activeCount}`, sub: t.junta.intermittentSub(stats.intermittentCount) },
    { label: t.junta.statsQuota, value: `${stats.quotaPaidCount}/${stats.totalMembersForQuota}`, sub: `${currentYear}` },
    { label: t.junta.statsBolos, value: `${stats.bolosThisYear}`, sub: `${currentYear}` },
    { label: t.junta.statsAvgAttendance, value: `${stats.avgAttendance}`, sub: t.junta.perBoloSub },
  ];
  return (
    <Grid cols={2} gap={8} style={{ marginBottom: 16 }}>
      {items.map((s) => (
        <div key={s.label} style={{ background: "var(--color-surface)", borderRadius: 20, boxShadow: "var(--shadow-sm)", padding: "12px 14px" }}>
          <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: ".04em", marginBottom: 2 }}>{s.label}</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{s.value}</div>
          <div style={{ fontSize: 11, opacity: 0.45 }}>{s.sub}</div>
        </div>
      ))}
    </Grid>
  );
}
