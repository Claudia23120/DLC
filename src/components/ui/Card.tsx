import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type Elevation = "sm" | "md" | "lg" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
}

const ELEVATION_CLASS: Record<Elevation, string> = {
  sm: "elev-sm",
  md: "elev-md",
  lg: "elev-lg",
  none: "",
};

/** Surface container matching the DS `.card`. */
export function Card({ elevation = "sm", className, ...props }: CardProps) {
  return <div className={cn("card", ELEVATION_CLASS[elevation], className)} {...props} />;
}
