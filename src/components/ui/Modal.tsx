"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

/** Bottom-sheet modal matching the prototype's create/edit overlays. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,30,29,.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "88%",
          background: "var(--color-bg)",
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 22px 12px" }}>
          <h2 style={{ fontSize: 24, margin: 0, flex: 1 }}>{title}</h2>
          <button
            type="button"
            className="btn btn-icon"
            aria-label="Tanca"
            onClick={onClose}
            style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", width: 38, height: 38, flex: "none" }}
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div
          className="app-scroll"
          style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 22px 24px", display: "flex", flexDirection: "column", gap: 14 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
