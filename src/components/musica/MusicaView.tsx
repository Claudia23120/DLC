"use client";

import { usePersistedState } from "@/lib/hooks/usePersistedState";
import Link from "next/link";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Card } from "@/components/ui/Card";
import { Row, Stack } from "@/components/ui/Layout";
import { musicaContent } from "@/content/musica";
import { t } from "@/i18n/t";
import type { SongListItem } from "@/lib/data/songs";

type Tab = "instruments" | "repertori" | "glossari";

export function MusicaView({ songs }: { songs: SongListItem[] }) {
  const [tab, setTab] = usePersistedState<Tab>("musica-tab", "instruments");

  return (
    <Stack gap={16}>
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
        <Stack gap={10}>
          {musicaContent.instruments.items.map((item) => (
            <Card key={item.name} style={{ padding: "14px 16px", gap: 4 }}>
              <Row gap={8}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, flex: 1, minWidth: 0 }}>{item.name}</div>
                <span style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.45, flex: "none" }}>{item.family}</span>
              </Row>
              <div style={{ fontSize: 13, opacity: 0.75 }}>{item.description}</div>
            </Card>
          ))}
        </Stack>
      ) : tab === "repertori" ? (
        songs.length === 0 ? (
          <div className="surface-card" style={{ padding: "24px 16px", textAlign: "center", fontSize: 14, opacity: 0.6 }}>
            {t.songs.noSongs}
          </div>
        ) : (
          <div className="list-card">
            {songs.map((song) => (
              <Link
                key={song.id}
                href={`/musica/${song.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Row gap={10} className="list-row" style={{ padding: "13px 0" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{song.title}</div>
                    {song.kind && <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{song.kind}</div>}
                  </div>
                  <Row gap={6} style={{ flex: "none" }}>
                    {song.gp_url ? (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(34,197,94,.12)", color: "#16a34a" }}>
                        🎼 {t.songs.hasScore}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, opacity: 0.4 }}>{t.songs.noScore}</span>
                    )}
                    <span style={{ opacity: 0.4, fontSize: 16 }}>›</span>
                  </Row>
                </Row>
              </Link>
            ))}
          </div>
        )
      ) : (
        <Stack gap={16}>
          {musicaContent.glossari.seccions.map((seccio) => (
            <div key={seccio.titol}>
              <div className="caption" style={{ marginBottom: 8 }}>
                {seccio.titol}
              </div>
              <div className="list-card">
                {seccio.items.map((item) => (
                  <Row key={item.term} align="start" gap={10} className="list-row" style={{ padding: "12px 0" }}>
                    <span className="break-anywhere" style={{ fontFamily: "var(--font-heading)", fontSize: 13, flex: "0 0 min(110px, 34%)" }}>{item.term}</span>
                    <span style={{ fontSize: 13, opacity: 0.7, flex: 1, minWidth: 0 }}>{item.definition}</span>
                  </Row>
                ))}
              </div>
            </div>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
