import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Layout primitives. Use these instead of inline `display: flex/grid` so the
 * layout can respond to screen size (classes live in globals.css).
 */

type LayoutProps<T extends ElementType> = {
  /** Element to render. Defaults to `div`. */
  as?: T;
  /** Gap in px. */
  gap?: number;
} & Omit<HTMLAttributes<HTMLElement>, "style"> & { style?: CSSProperties };

type CssVars = CSSProperties & Record<`--${string}`, string | number | undefined>;

/** Vertical flex column. */
export function Stack<T extends ElementType = "div">({
  as,
  gap = 12,
  className,
  style,
  ...rest
}: LayoutProps<T>) {
  const Tag: ElementType = as ?? "div";
  const vars: CssVars = { "--gap": `${gap}px`, ...style };
  return <Tag className={cn("stack", className)} style={vars} {...rest} />;
}

const JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
} as const;

const ALIGN = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
} as const;

/** Horizontal flex row. */
export function Row<T extends ElementType = "div">({
  as,
  gap = 8,
  align = "center",
  justify = "start",
  wrap = false,
  className,
  style,
  ...rest
}: LayoutProps<T> & {
  align?: keyof typeof ALIGN;
  justify?: keyof typeof JUSTIFY;
  wrap?: boolean;
}) {
  const Tag: ElementType = as ?? "div";
  const vars: CssVars = {
    "--gap": `${gap}px`,
    "--align": ALIGN[align],
    "--justify": JUSTIFY[justify],
    ...style,
  };
  return <Tag className={cn("row", wrap && "row-wrap", className)} style={vars} {...rest} />;
}

/** Number of equal columns, optionally changing at the project breakpoints. */
export type Cols = number | { base?: number; sm?: number; desktop?: number };

/**
 * Equal-width column grid. Cells can shrink below their content, so long text
 * wraps instead of pushing the page wider than the screen.
 *
 *   <Grid cols={2}>                          // always 2
 *   <Grid cols={{ base: 1, sm: 2, desktop: 3 }}>
 */
export function Grid<T extends ElementType = "div">({
  as,
  cols = 1,
  gap = 8,
  className,
  style,
  ...rest
}: LayoutProps<T> & { cols?: Cols }) {
  const Tag: ElementType = as ?? "div";
  const c = typeof cols === "number" ? { base: cols } : cols;
  const vars: CssVars = {
    "--gap": `${gap}px`,
    "--cols-base": c.base,
    "--cols-sm": c.sm,
    "--cols-desktop": c.desktop,
    ...style,
  };
  return <Tag className={cn("grid-resp", className)} style={vars} {...rest} />;
}
