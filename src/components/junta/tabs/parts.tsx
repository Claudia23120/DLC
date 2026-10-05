"use client";

import { useTransition, type ReactNode } from "react";
import { deleteEventAction } from "@/app/(app)/junta/actions";
import { t } from "@/i18n/t";

export interface StatusStyle {
  label: string;
  color: string;
  bg: string;
}

export const STATUS_OPEN = { color: "#16a34a", bg: "rgba(34,197,94,.12)" };
export const STATUS_CLOSED = { color: "rgba(32,30,29,.45)", bg: "rgba(32,30,29,.07)" };

export function StatusPill({ label, color, bg }: StatusStyle) {
  return (
    <span style={{
      fontSize: 11, padding: "2px 9px", borderRadius: 999,
      background: bg, color, letterSpacing: ".04em", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

export function ActionBtn({
  onClick, disabled, children,
}: {
  onClick: () => void; disabled?: boolean; children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn btn-secondary btn-sm"
    >
      {children}
    </button>
  );
}

/** Destructive button: confirms, then runs `onConfirm` in a transition. */
export function DangerBtn({
  label, confirmText, onConfirm,
}: {
  label: string; confirmText: string; onConfirm: () => void | Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  function handleClick() {
    if (!window.confirm(confirmText)) return;
    startTransition(() => { onConfirm(); });
  }
  return (
    <button onClick={handleClick} disabled={pending} className="btn btn-secondary btn-sm btn-danger">
      {label}
    </button>
  );
}

export function DeleteEventBtn({ eventId }: { eventId: string }) {
  return (
    <DangerBtn
      label={t.create.deleteEvent}
      confirmText={t.create.deleteConfirm}
      onConfirm={() => deleteEventAction(eventId)}
    />
  );
}

/** White rounded card wrapping a list of rows (or an empty-state message). */
export function ListCard({ empty, emptyText, children }: { empty: boolean; emptyText: string; children: ReactNode }) {
  return (
    <div className="surface-card" style={{ overflow: "hidden" }}>
      {empty ? <p style={{ padding: 20, opacity: 0.5, fontSize: 14 }}>{emptyText}</p> : children}
    </div>
  );
}

export const rowTitleStyle = { fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase" } as const;
