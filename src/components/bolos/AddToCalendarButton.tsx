"use client";

import { useState } from "react";
import { CalendarIcon } from "@/components/ui/icons";
import { t } from "@/i18n/t";

interface AddToCalendarButtonProps {
  /** URL of the .ics download route for this event. */
  icsHref: string;
  /** Google Calendar "add event" URL. */
  googleHref: string;
  variant?: "icon" | "button";
}

/**
 * "Add to my calendar" — offers both a downloadable .ics (Apple/most apps) and
 * a Google Calendar link. Icon variant for cards, full button for detail pages.
 */
export function AddToCalendarButton({ icsHref, googleHref, variant = "icon" }: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", flex: "none" }}>
      {variant === "icon" ? (
        <button
          type="button"
          className="btn btn-icon"
          title={t.common.addToCalendarShort}
          aria-label={t.common.addToCalendarShort}
          onClick={() => setOpen((v) => !v)}
          style={{ background: "var(--color-surface)", color: "var(--color-accent-700)", width: 32, height: 32 }}
        >
          <CalendarIcon size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setOpen((v) => !v)}
          style={{ height: 44, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}
        >
          <CalendarIcon size={17} />
          {t.common.addToCalendar}
        </button>
      )}

      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 41,
              background: "var(--color-surface)",
              borderRadius: 16,
              boxShadow: "var(--shadow-md)",
              padding: 6,
              minWidth: 190,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <a
              href={icsHref}
              onClick={() => setOpen(false)}
              style={{ padding: "10px 12px", borderRadius: 10, fontSize: 14, color: "var(--color-text)", textDecoration: "none" }}
            >
              Apple / .ics
            </a>
            <a
              href={googleHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{ padding: "10px 12px", borderRadius: 10, fontSize: 14, color: "var(--color-text)", textDecoration: "none" }}
            >
              Google Calendar
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}
