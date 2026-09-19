"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

// iOS Safari requires AudioContext.resume() to be called synchronously within a
// user gesture. AlphaTab creates its AudioContext internally; we capture it by
// monkey-patching window.AudioContext before AlphaTab initialises.
let capturedCtx: AudioContext | null = null;
function patchAudioContext() {
  if (typeof window === "undefined" || capturedCtx !== null) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const OrigCtx: typeof AudioContext = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!OrigCtx) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).AudioContext = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new OrigCtx(...(args as []));
    capturedCtx = ctx;
    return ctx;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).AudioContext.prototype = OrigCtx.prototype;
}

// Call inside a synchronous click handler — iOS unlocks audio here.
function resumeCapturedContext() {
  if (capturedCtx && capturedCtx.state === "suspended") {
    capturedCtx.resume().catch(() => {});
  }
}

function trackIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("surdo"))                         return "🔵";
  if (n.includes("caixa") || n.includes("snare"))  return "🟡";
  if (n.includes("repenique"))                      return "🔴";
  if (n.includes("agogo"))                          return "🔔";
  if (n.includes("tamborim"))                       return "⚪";
  if (n.includes("timba"))                          return "🟠";
  if (n.includes("goliath") || n.includes("tom"))   return "🟤";
  return "🥁";
}

interface TrackState { name: string; muted: boolean; solo: boolean; }

export function AlphaTabPlayer({ gpUrl }: { gpUrl: string }) {
  const scoreRef  = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracksRef = useRef<any[]>([]);

  const [status,     setStatus]     = useState<"loading" | "ready" | "error">("loading");
  const [playing,    setPlaying]    = useState(false);
  const [tracks,     setTracks]     = useState<TrackState[]>([]);
  const [activeIdx,  setActiveIdx]  = useState<number | null>(null);
  const [currentBar, setCurrentBar] = useState(0);
  const [totalBars,  setTotalBars]  = useState(0);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let api: any;

    async function init() {
      try {
        // Patch BEFORE loading alphaTab so we capture its AudioContext.
        patchAudioContext();
        await ensureAlphaTab();
        if (destroyed || !scoreRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const at = (window as any).alphaTab;
        api = new at.AlphaTabApi(scoreRef.current, {
          core: { logLevel: 0 },
          player: { enablePlayer: true, enableCursor: true, soundFont: SF_CDN, scrollMode: 1 },
          display: { layoutMode: 0, scale: 0.9 },
        });
        apiRef.current = api;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api.scoreLoaded.on((score: any) => {
          if (destroyed) return;
          tracksRef.current = score.tracks;
          api.renderTracks(score.tracks);
          setTotalBars(score.masterBars?.length ?? 0);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTracks(score.tracks.map((tr: any) => ({
            name: tr.name || `Instrument ${tr.index + 1}`,
            muted: false,
            solo: false,
          })));
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
    return () => {
      destroyed = true;
      if (api) { try { api.destroy(); } catch { /* */ } }
    };
  }, [gpUrl]);

  // Synchronous click handler — iOS requires resume() here, not inside a promise.
  function handlePlayPause() {
    resumeCapturedContext();
    apiRef.current?.playPause();
  }

  function selectTrack(i: number) {
    if (!apiRef.current) return;
    if (activeIdx === i) {
      setActiveIdx(null);
      apiRef.current.renderTracks(tracksRef.current);
    } else {
      setActiveIdx(i);
      apiRef.current.renderTracks([tracksRef.current[i]]);
    }
  }

  function toggleMute(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    setTracks((prev) => {
      const next = prev.map((tr, idx) => idx === i ? { ...tr, muted: !tr.muted } : tr);
      if (apiRef.current && tracksRef.current[i])
        apiRef.current.changeTrackMute([tracksRef.current[i]], next[i].muted);
      return next;
    });
  }

  function toggleSolo(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    setTracks((prev) => {
      const next = prev.map((tr, idx) => idx === i ? { ...tr, solo: !tr.solo } : tr);
      if (apiRef.current && tracksRef.current[i])
        apiRef.current.changeTrackSolo([tracksRef.current[i]], next[i].solo);
      return next;
    });
  }

  const isLoading = status === "loading";

  // Fixed controls bar rendered via portal so it's never inside overflow:hidden.
  const controlsBar = mounted ? createPortal(
    <div style={{
      position: "fixed",
      bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
      left: 0,
      right: 0,
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 16px",
      background: "var(--color-bg)",
      borderTop: "1px solid rgba(32,30,29,.10)",
      boxShadow: "0 -4px 16px rgba(46,43,37,.10)",
    }}>
      <button
        onClick={handlePlayPause}
        disabled={status !== "ready"}
        className="btn btn-primary"
        style={{ height: 44, padding: "0 24px", fontSize: 15, flex: "none", borderRadius: 99 }}
      >
        {isLoading ? t.common.loading : playing ? t.songs.stop : t.songs.play}
      </button>

      {totalBars > 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: "rgba(32,30,29,.1)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "var(--color-accent-500)",
              borderRadius: 99,
              width: `${(currentBar / totalBars) * 100}%`,
              transition: "width .1s",
            }} />
          </div>
          <span style={{ fontSize: 12, opacity: 0.5, whiteSpace: "nowrap" }}>{currentBar}/{totalBars}</span>
        </div>
      )}

      {status === "error" && (
        <span style={{ fontSize: 13, color: "var(--color-accent-500)" }}>Error carregant la partitura.</span>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      {controlsBar}

      {/* Score card — padding-bottom so content isn't hidden under the fixed bar */}
      <div style={{
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        background: "var(--color-surface)",
        display: "flex",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      }}>
        {tracks.length > 0 && (
          <div style={{
            width: 100,
            flex: "none",
            borderRight: "1px solid rgba(32,30,29,.07)",
            background: "#faf8f5",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}>
            <button
              onClick={() => { setActiveIdx(null); apiRef.current?.renderTracks(tracksRef.current); }}
              style={{
                border: "none",
                background: activeIdx === null ? "rgba(209,70,47,.1)" : "transparent",
                borderBottom: "1px solid rgba(32,30,29,.07)",
                padding: "10px 6px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 18 }}>🎵</span>
              <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: ".04em" }}>TOTS</span>
            </button>

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
                    cursor: "pointer",
                    textAlign: "center",
                    padding: "10px 6px",
                    borderBottom: "1px solid rgba(32,30,29,.06)",
                    background: isActive ? "rgba(209,70,47,.1)" : "transparent",
                    opacity: tr.muted ? 0.35 : 1,
                    transition: "opacity .15s, background .1s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{trackIcon(tr.name)}</span>
                  <span style={{ fontSize: 9, lineHeight: 1.2, opacity: 0.65, maxWidth: 86, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tr.name}
                  </span>
                  <div style={{ display: "flex", gap: 3 }}>
                    <button onClick={(e) => toggleMute(i, e)} title="Silencia"
                      style={{ width: 22, height: 16, fontSize: 8, fontWeight: 700, border: "none", borderRadius: 3, cursor: "pointer", background: tr.muted ? "#374151" : "rgba(32,30,29,.15)", color: tr.muted ? "#fff" : "inherit" }}>M</button>
                    <button onClick={(e) => toggleSolo(i, e)} title="Solo"
                      style={{ width: 22, height: 16, fontSize: 8, fontWeight: 700, border: "none", borderRadius: 3, cursor: "pointer", background: tr.solo ? "var(--color-accent-500)" : "rgba(32,30,29,.15)", color: tr.solo ? "#fff" : "inherit" }}>S</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", position: "relative", background: "#fff" }}>
          <div ref={scoreRef} />
        </div>
      </div>
    </>
  );
}
