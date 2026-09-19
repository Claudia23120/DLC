"use client";

import { useState, useEffect } from "react";

export function usePersistedState<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) setValue(JSON.parse(saved) as T);
    } catch {}
  }, [key]);

  const set = (v: T) => {
    setValue(v);
    try { sessionStorage.setItem(key, JSON.stringify(v)); } catch {}
  };

  return [value, set];
}
