"use client";

import { useState, useTransition } from "react";
import { setMeetingAttendance } from "@/app/(app)/reunions/actions";
import { t } from "@/i18n/t";
import type { MeetingResponse } from "@/types/database";

interface Props {
  eventId: string;
  initial: MeetingResponse | null;
  size?: "sm" | "lg";
}

/** "Hi seré" / "No puc" toggle for a meeting. */
export function MeetingResponseButtons({ eventId, initial, size = "lg" }: Props) {
  const [response, setResponse] = useState<MeetingResponse | null>(initial);
  const [, startTransition] = useTransition();

  const pick = (value: MeetingResponse) => {
    setResponse(value);
    startTransition(() => {
      void setMeetingAttendance(eventId, value);
    });
  };

  const height = size === "lg" ? 48 : 44;
  const yesActive = response === "yes";
  const noActive = response === "no";

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={() => pick("yes")}
        style={{
          flex: 1,
          height,
          borderRadius: 999,
          cursor: "pointer",
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: yesActive ? "var(--color-accent-500)" : "rgba(32,30,29,.22)",
          background: yesActive ? "var(--color-accent-500)" : "transparent",
          color: yesActive ? "#fff" : "var(--color-text)",
        }}
      >
        {t.meetings.willAttend}
      </button>
      <button
        type="button"
        onClick={() => pick("no")}
        style={{
          flex: 1,
          height,
          borderRadius: 999,
          cursor: "pointer",
          fontFamily: "var(--font-heading)",
          fontSize: 15,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: noActive ? "#cfc5ae" : "rgba(32,30,29,.22)",
          background: noActive ? "#e0d8c7" : "transparent",
          color: noActive ? "var(--color-sand-800)" : "var(--color-text)",
        }}
      >
        {t.meetings.cantAttend}
      </button>
    </div>
  );
}
