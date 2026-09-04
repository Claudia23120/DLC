interface ProgressBarProps {
  /** 0–100 (percentage). */
  value: number;
  color?: string;
  track?: string;
  height?: number;
}

/** Thin progress bar used by polls and badge ladders. */
export function ProgressBar({
  value,
  color = "var(--color-accent-500)",
  track = "rgba(32,30,29,.08)",
  height = 8,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ height, borderRadius: 999, background: track, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}
