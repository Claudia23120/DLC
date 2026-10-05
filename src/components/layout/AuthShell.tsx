import type { ReactNode } from "react";
import { FlameIcon } from "@/components/ui/icons";

/**
 * Full-screen dark frame shared by login, password reset and 404: decorative
 * circles, a hero block pushed to the top, and the form/CTA pinned to the
 * bottom (respecting the iOS home indicator).
 */
export function AuthShell({
  hero,
  children,
  bottomPad = 40,
}: {
  hero: ReactNode;
  children: ReactNode;
  /** Bottom padding in px (the safe-area inset is added on top). */
  bottomPad?: number;
}) {
  return (
    <div
      className="auth-screen min-screen"
      style={{ paddingBottom: `calc(${bottomPad}px + env(safe-area-inset-bottom, 0px))` }}
    >
      <div className="auth-circle auth-circle-a" />
      <div className="auth-circle auth-circle-b" />
      <div className="auth-hero">{hero}</div>
      <div className="auth-body">{children}</div>
    </div>
  );
}

/** Round flame badge used at the top of the auth hero blocks. */
export function AuthIcon() {
  return (
    <div className="auth-icon">
      <FlameIcon size={40} stroke="#fdece9" />
    </div>
  );
}
