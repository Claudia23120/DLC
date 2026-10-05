"use client";

import type { CSSProperties, ReactNode } from "react";

export function FocBlock({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={style}>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: 0.4,
          marginBottom: 6,
          opacity: 0.8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
