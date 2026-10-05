"use client";

import { t } from "@/i18n/t";

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-ghost tap-target"
      onClick={onClick}
      style={{ height: 38, fontSize: 13, alignSelf: "flex-start" }}
    >
      + {label}
    </button>
  );
}


export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="tap-target"
      onClick={onClick}
      aria-label={t.foc.remove}
      style={{
        flex: "none",
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "1px solid rgba(32,30,29,.15)",
        background: "transparent",
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      ✕
    </button>
  );
}
