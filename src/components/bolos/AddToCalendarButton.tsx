"use client";

import { CalendarIcon } from "@/components/ui/icons";
import { t } from "@/i18n/t";

interface AddToCalendarButtonProps {
  icsHref: string;
  googleHref: string;
  variant?: "icon" | "button";
}

function isApple(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|ad|od)|Macintosh/i.test(navigator.userAgent);
}

export function AddToCalendarButton({ icsHref, googleHref, variant = "icon" }: AddToCalendarButtonProps) {
  function handleClick() {
    if (isApple()) {
      window.location.href = icsHref;
    } else {
      window.open(googleHref, "_blank", "noopener,noreferrer");
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        className="btn btn-icon"
        title={t.common.addToCalendarShort}
        aria-label={t.common.addToCalendarShort}
        onClick={handleClick}
        style={{ background: "var(--color-surface)", color: "var(--color-accent-700)", width: 32, height: 32, flex: "none" }}
      >
        <CalendarIcon size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={handleClick}
      style={{ height: 44, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}
    >
      <CalendarIcon size={17} />
      {t.common.addToCalendar}
    </button>
  );
}
