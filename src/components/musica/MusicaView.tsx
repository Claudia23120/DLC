"use client";

import { useState } from "react";
import Link from "next/link";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Card } from "@/components/ui/Card";
import { musicaContent } from "@/content/musica";
import { t } from "@/i18n/t";
import type { SongRow } from "@/lib/data/songs";

type Tab = "instruments" | "repertori" | "glossari";

export function MusicaView({ songs }: { songs: SongRow[] }) {
  const [tab, setTab] = useState<Tab>("instruments");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SegmentedControl
        options={[
          { value: "instruments", label: "Instruments" },
          { value: "repertori", label: "Repertori" },
          { value: "glossari", label: "Glossari" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "instruments" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {musicaContent.instruments.items.map((item) => (
            <Card key={item.name} style={{ padding: "14px 16px", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, flex: 1 }}>{item.name}</div>
                <span style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.45, flex: "none" }}>{item.family}</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>{item.description}</div>
            </Card>
          ))}
        </div>
      ) : tab === "repertori" ? (
        songs.length === 0 ? (
          <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "24px 16px", textAlign: "center", fontSize: 14, opacity: 0.6 }}>
            {t.songs.noSongs}
          </div>
        ) : (
          <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 16px" }}>
            {songs.map((song) => (
              <Link
                key={song.id}
                href={`/musica/${song.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "13px 0", borderBottom: "1px solid rgba(32,30,29,.07)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{song.title}</div>
                    {song.kind && <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{song.kind}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                    {song.gp_url ? (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(34,197,94,.12)", color: "#16a34a" }}>
                        🎼 {t.songs.hasScore}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, opacity: 0.4 }}>{t.songs.noScore}</span>
                    )}
                    <span style={{ opacity: 0.4, fontSize: 16 }}>›</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {musicaContent.glossari.seccions.map((seccio) => (
            <div key={seccio.titol}>
              <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.5, marginBottom: 8 }}>
                {seccio.titol}
              </div>
              <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 16px" }}>
                {seccio.items.map((item) => (
                  <div key={item.term} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, flex: "0 0 110px" }}>{item.term}</span>
                    <span style={{ fontSize: 13, opacity: 0.7, flex: 1 }}>{item.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
