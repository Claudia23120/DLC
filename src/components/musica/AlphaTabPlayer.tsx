"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/i18n/t";

const AT_CDN = "https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.4.0/dist/alphaTab.min.js";
const SF_CDN = "https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.4.0/dist/soundfont/sonivox.sf2";

let atLoadPromise: Promise<void> | null = null;
function ensureAlphaTab(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).alphaTab) return Promise.resolve();
  if (atLoadPromise) return atLoadPromise;
  atLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = AT_CDN;
    s.onload = () => resolve();
    s.onerror = () => { atLoadPromise = null; reject(new Error("No s'ha pogut carregar alphaTab")); };
    document.head.appendChild(s);
  });
  return atLoadPromise;
}

function trackIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("surdo"))                    return "🔵";
  if (n.includes("caixa") || n.includes("snare")) return "🟡";
  if (n.includes("repenique"))                return "🔴";
  if (n.includes("agogo"))                    return "🔔";
  if (n.includes("tamborim"))                 return "⚪";
  if (n.includes("timba"))                    return "🟠";
  if (n.includes("goliath") || n.includes("tom")) return "🟤";
  return "🥁";
}

interface TrackState {
  name: string;
  muted: boolean;
  solo: boolean;
}

export function AlphaTabPlayer({ gpUrl }: { gpUrl: string }) {
  const scoreRef  = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracksRef = useRef<any[]>([]);

  const [status,       setStatus]       = useState<"loading" | "ready" | "error">("loading");
  const [playing,      setPlaying]      = useState(false);
  const [tracks,       setTracks]       = useState<TrackState[]>([]);
  // null = show all tracks; number = show only track at that index
  const [activeIdx,    setActiveIdx]    = useState<number | null>(null);
  const [currentBar,   setCurrentBar]   = useState(0);
  const [totalBars,    setTotalBars]    = useState(0);

  useEffect(() => {
    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let api: any;

    async function init() {
      try {
        await ensureAlphaTab();
        if (destroyed || !scoreRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const at = (window as any).alphaTab;
        api = new at.AlphaTabApi(scoreRef.current, {
          core: { logLevel: 0 },
          player: {
            enablePlayer: true,
            enableCursor: true,
            soundFont: SF_CDN,
            scrollMode: 1,
          },
          display: { layoutMode: 0, scale: 0.9 },
        });
        apiRef.current = api;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.scoreLoaded.on((score: any) => {
          if (destroyed) return;
          tracksRef.current = score.tracks;
          api.renderTracks(score.tracks); // show all by default
          setTotalBars(score.masterBars?.length ?? 0);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTracks(score.tracks.map((tr: any) => ({ name: tr.name || `Instrument ${tr.index + 1}`, muted: false, solo: false })));
        });

        api.playerReady.on(() => { if (!destroyed) setStatus("ready"); });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.playerStateChanged.on((e: any) => { if (!destroyed) setPlaying(e.state === 1); });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.playerPositionChanged.on((e: any) => { if (!destroyed) setCurrentBar(e.currentMeasure + 1); });
        api.error.on((e: unknown) => { console.error("alphaTab:", e); if (!destroyed) setStatus("error"); });

        const res = await fetch(gpUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        api.load(await res.arrayBuffer());
      } catch (err) {
        console.error("alphaTab init:", err);
        if (!destroyed) setStatus("error");
      }
    }

    init();
    return () => { destroyed = true; if (api) { try { api.destroy(); } catch { /* */ } } };
  }, [gpUrl]);

  // ── Visual track selection ────────────────────────────────────────────────
  function selectTrack(i: number) {
    if (!apiRef.current) return;
    if (activeIdx === i) {
      // clicking the active track → show all
      setActiveIdx(null);
      apiRef.current.renderTracks(tracksRef.current);
    } else {
      setActiveIdx(i);
      apiRef.current.renderTracks([tracksRef.current[i]]);
    }
  }

  // ── Audio mute / solo ─────────────────────────────────────────────────────
  function toggleMute(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    setTracks((prev) => {
      const next = prev.map((tr, idx) => idx === i ? { ...tr, muted: !tr.muted } : tr);
      if (apiRef.current && tracksRef.current[i]) apiRef.current.changeTrackMute([tracksRef.current[i]], next[i].muted);
      return next;
    });
  }

  function toggleSolo(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    setTracks((prev) => {
      const next = prev.map((tr, idx) => idx === i ? { ...tr, solo: !tr.solo } : tr);
      if (apiRef.current && tracksRef.current[i]) apiRef.current.changeTrackSolo([tracksRef.current[i]], next[i].solo);
      return next;
    });
  }

  const isLoading = status === "loading";

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)", background: "var(--color-surface)", display: "flex", flexDirection: "column" }}>

      {/* ── Top controls ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(32,30,29,.07)" }}>
        <button
          onClick={() => apiRef.current?.playPause()}
          disabled={status !== "ready"}
          className="btn btn-primary"
          style={{ height: 38, padding: "0 18px", fontSize: 14, flex: "none" }}
        >
          {isLoading ? t.common.loading : playing ? t.songs.stop : t.songs.play}
        </button>

        {/* Progress bar */}
        {totalBars > 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: "rgba(32,30,29,.1)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--color-accent-500)", borderRadius: 99, width: `${(currentBar / totalBars) * 100}%`, transition: "width .1s" }} />
            </div>
            <span style={{ fontSize: 12, opacity: 0.5, whiteSpace: "nowrap" }}>{currentBar}/{totalBars}</span>
          </div>
        )}

        {status === "error" && (
          <span style={{ fontSize: 13, color: "var(--color-accent-500)" }}>Error carregant la partitura.</span>
        )}
      </div>

      {/* ── Sidebar + score ────────────────────────────────────────── */}
      <div style={{ display: "flex", minHeight: 400 }}>

        {/* Sidebar */}
        {tracks.length > 0 && (
          <div style={{ width: 100, flex: "none", borderRight: "1px solid rgba(32,30,29,.07)", background: "#faf8f5", display: "flex", flexDirection: "column", overflowY: "auto" }}>

            {/* "Tots" button */}
            <button
              onClick={() => { setActiveIdx(null); apiRef.current?.renderTracks(tracksRef.current); }}
              style={{
                border: "none", background: activeIdx === null ? "rgba(209,70,47,.1)" : "transparent",
                borderBottom: "1px solid rgba(32,30,29,.07)", padding: "10px 6px",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}
            >
              <span style={{ fontSize: 18 }}>🎵</span>
              <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: ".04em" }}>TOTS</span>
            </button>

            {/* One row per instrument */}
            {tracks.map((tr, i) => {
              const isActive = activeIdx === i;
              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectTrack(i)}
                  onKeyDown={(e) => e.key === "Enter" && selectTrack(i)}
                  style={{
                    cursor: "pointer", textAlign: "center",
                    padding: "10px 6px", borderBottom: "1px solid rgba(32,30,29,.06)",
                    background: isActive ? "rgba(209,70,47,.1)" : "transparent",
                    opacity: tr.muted ? 0.35 : 1, transition: "opacity .15s, background .1s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{trackIcon(tr.name)}</span>
                  <span style={{ fontSize: 9, lineHeight: 1.2, opacity: 0.65, maxWidth: 86, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tr.name}
                  </span>
                  {/* M / S buttons */}
                  <div style={{ display: "flex", gap: 3 }}>
                    <button
                      onClick={(e) => toggleMute(i, e)}
                      title="Silencia"
                      style={{
                        width: 22, height: 16, fontSize: 8, fontWeight: 700,
                        border: "none", borderRadius: 3, cursor: "pointer",
                        background: tr.muted ? "#374151" : "rgba(32,30,29,.15)",
                        color: tr.muted ? "#fff" : "inherit",
                      }}
                    >M</button>
                    <button
                      onClick={(e) => toggleSolo(i, e)}
                      title="Solo"
                      style={{
                        width: 22, height: 16, fontSize: 8, fontWeight: 700,
                        border: "none", borderRadius: 3, cursor: "pointer",
                        background: tr.solo ? "var(--color-accent-500)" : "rgba(32,30,29,.15)",
                        color: tr.solo ? "#fff" : "inherit",
                      }}
                    >S</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Score */}
        <div style={{ flex: 1, overflow: "auto", position: "relative", background: "#fff" }}>
          <div ref={scoreRef} />
        </div>
      </div>
    </div>
  );
}
