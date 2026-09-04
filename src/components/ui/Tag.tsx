import { cn } from "@/lib/utils/cn";
import type { CSSProperties, HTMLAttributes } from "react";

type Variant = "accent" | "neutral" | "outline" | "custom";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  /** For variant="custom": background + text colors (as in the prototype's inline tags). */
  bg?: string;
  color?: string;
}

const VARIANT_CLASS: Record<Exclude<Variant, "custom">, string> = {
  accent: "tag-accent",
  neutral: "tag-neutral",
  outline: "tag-outline",
};

/** Small label / status pill matching the DS `.tag`. */
export function Tag({
  variant = "neutral",
  bg,
  color,
  className,
  style,
  ...props
}: TagProps) {
  const customStyle: CSSProperties | undefined =
    variant === "custom" ? { background: bg, color, ...style } : style;

  return (
    <span
      className={cn("tag", variant !== "custom" && VARIANT_CLASS[variant], className)}
      style={customStyle}
      {...props}
    />
  );
}
