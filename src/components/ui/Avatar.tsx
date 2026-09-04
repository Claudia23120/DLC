import type { CSSProperties } from "react";

interface AvatarProps {
  /** Full name; initials are derived from it when `initials` is not given. */
  name: string;
  initials?: string;
  size?: number;
  bg?: string;
  color?: string;
  className?: string;
}

/** Derive up-to-two uppercase initials from a name. */
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Circular initials avatar, as used throughout the design. */
export function Avatar({
  name,
  initials,
  size = 44,
  bg = "var(--color-accent-200)",
  color = "var(--color-accent-800)",
  className,
}: AvatarProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    background: bg,
    color,
    fontFamily: "var(--font-heading)",
    fontSize: Math.round(size * 0.34),
  };
  return (
    <div
      className={className}
      style={{
        ...style,
        flex: "none",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textTransform: "uppercase",
      }}
    >
      {initials ?? initialsOf(name)}
    </div>
  );
}
