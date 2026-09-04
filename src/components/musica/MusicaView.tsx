"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Card } from "@/components/ui/Card";
import { musicaContent } from "@/content/musica";

type Tab = "instruments" | "repertori" | "glossari";

export function MusicaView() {
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
        <div style={{ background: "var(--color-surface)", borderRadius: 22, boxShadow: "var(--shadow-sm)", padding: "4px 16px" }}>
          {musicaContent.repertori.items.map((item) => (
            <div key={item.title} style={{ padding: "12px 0", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{item.title}</div>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{item.kind}</div>
            </div>
          ))}
        </div>
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
