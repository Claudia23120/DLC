"use client";

import { useState, useTransition } from "react";
import { Tag } from "@/components/ui/Tag";
import { remindPending } from "@/app/(app)/bolos/actions";
import { t } from "@/i18n/t";

export interface SummaryCell {
  label: string;
  value: string;
  bg: string;
  color: string;
}

export function BoloAdminSummary({ eventId, cells }: { eventId: string; cells: SummaryCell[] }) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const remind = () => {
    startTransition(async () => {
      await remindPending(eventId);
      setSent(true);
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <h3 style={{ fontSize: 20, margin: 0 }}>{t.boloDetail.summary}</h3>
        <Tag variant="accent">{t.common.onlyBoard}</Tag>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {cells.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", borderRadius: 20, background: c.bg, boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontSize: 12, color: c.color }}>{c.label}</span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: c.color }}>{c.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={remind} disabled={pending || sent} style={{ flex: 1, height: 44, fontSize: 14 }}>
          {sent ? t.boloDetail.reminded : t.boloDetail.remindPending}
        </button>
      </div>
    </div>
  );
}
