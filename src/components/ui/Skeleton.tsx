/** Pulsing grey placeholder bar. */
export function Skeleton({
  height = 48,
  borderRadius = 16,
  width = "100%",
}: {
  height?: number;
  borderRadius?: number;
  width?: number | string;
}) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        background: "rgba(32,30,29,.07)",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

/** A full page skeleton: header area + N card rows. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header placeholder */}
      <div style={{ padding: "28px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton height={14} width={80} borderRadius={8} />
        <Skeleton height={32} width={200} borderRadius={8} />
      </div>
      {/* Card rows */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={64} borderRadius={20} />
        ))}
      </div>
    </div>
  );
}
