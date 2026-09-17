"use client";

import dynamic from "next/dynamic";
import { t } from "@/i18n/t";

const AlphaTabPlayer = dynamic(
  () => import("@/components/musica/AlphaTabPlayer").then((m) => m.AlphaTabPlayer),
  { ssr: false },
);

export function SongPlayer({ gpUrl }: { gpUrl: string }) {
  return <AlphaTabPlayer gpUrl={gpUrl} />;
}

export function PendingScore() {
  return (
    <div style={{
      background: "var(--color-surface)", borderRadius: 14, padding: 32,
      boxShadow: "var(--shadow-sm)", textAlign: "center", display: "flex",
      flexDirection: "column", gap: 8, alignItems: "center",
    }}>
      <div style={{ fontSize: 36 }}>🎼</div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>
        {t.songs.pendingScore}
      </div>
      <div style={{ fontSize: 14, opacity: 0.6 }}>
        {t.songs.pendingNote}
      </div>
    </div>
  );
}
