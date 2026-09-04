"use client";

import type { CSSProperties } from "react";

type Tone = "red" | "sage" | "ink" | "mute";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  tone?: Tone;
  className?: string;
}

/** Active-pill colors, mirroring the prototype's `pill()` helper. */
function pillStyle(active: boolean, tone: Tone): CSSProperties {
  if (!active) {
    return { background: "transparent", color: "var(--color-text)", borderColor: "rgba(32,30,29,.22)" };
  }
  switch (tone) {
    case "sage":
      return { background: "var(--color-sage-500)", color: "#fff", borderColor: "var(--color-sage-500)" };
    case "ink":
      return { background: "var(--color-sand-800)", color: "#fff", borderColor: "var(--color-sand-800)" };
    case "mute":
      return { background: "#e0d8c7", color: "var(--color-sand-800)", borderColor: "#cfc5ae" };
    default:
      return { background: "var(--color-accent-500)", color: "#fff", borderColor: "var(--color-accent-500)" };
  }
}

/** Row of pill tabs, as used for Llista/Calendari/Històric etc. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  tone = "red",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={className} style={{ display: "flex", gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            fontSize: 14,
            borderWidth: 1,
            borderStyle: "solid",
            ...pillStyle(opt.value === value, tone),
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
