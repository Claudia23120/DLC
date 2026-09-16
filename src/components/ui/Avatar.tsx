import type { CSSProperties } from "react";

interface AvatarProps {
  /** Full name; initials are derived from it when `initials` is not given. */
  name: string;
  initials?: string;
  url?: string | null;
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

/** Circular avatar: shows a photo if `url` is given, otherwise initials. */
export function Avatar({
  name,
  initials,
  url,
  size = 44,
  bg = "var(--color-accent-200)",
  color = "var(--color-accent-800)",
  className,
}: AvatarProps) {
  const base: CSSProperties = {
    width: size,
    height: size,
    flex: "none",
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={className}
        style={{ ...base, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        ...base,
        background: bg,
        color,
        fontFamily: "var(--font-heading)",
        fontSize: Math.round(size * 0.34),
        textTransform: "uppercase",
      }}
    >
      {initials ?? initialsOf(name)}
    </div>
  );
}
