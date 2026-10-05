"use client";

import { useEffect, useState } from "react";
import { defaultFocConfig, focStorageKey, type FocConfig } from "@/lib/domain/foc";

/**
 * Fire-sheet state, mirrored to this browser's localStorage only (never the
 * database). Saving is skipped until the stored sheet has been loaded, so the
 * defaults never overwrite an in-progress sheet.
 */
export function useFocConfig(eventId: string, defaultTitle: string, diableNames: string[]) {
  const [config, setConfig] = useState<FocConfig>(() => defaultFocConfig(defaultTitle, diableNames));
  const [hydrated, setHydrated] = useState(false);

  // Load any in-progress sheet from this browser once, on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(focStorageKey(eventId));
      if (raw) setConfig(JSON.parse(raw) as FocConfig);
    } catch {
      /* corrupt / unavailable storage → keep defaults */
    }
    setHydrated(true);
  }, [eventId]);

  // Persist to localStorage on every change (after the initial load).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(focStorageKey(eventId), JSON.stringify(config));
    } catch {
      /* storage full / unavailable → ignore */
    }
  }, [config, eventId, hydrated]);

  const set = (patch: Partial<FocConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const reset = () => setConfig(defaultFocConfig(defaultTitle, diableNames));

  return { config, set, reset };
}
