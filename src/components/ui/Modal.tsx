"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";
import { Row } from "./Layout";
import { t } from "@/i18n/t";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

// iOS Safari ignores `overflow: hidden` on <body>, so the page behind keeps
// scrolling. Pinning the body with `position: fixed` works everywhere; the
// scroll position is restored on unlock. Counted so stacked modals are safe.
let lockCount = 0;
let lockedScrollY = 0;

function lockScroll() {
  if (lockCount++ > 0) return;
  lockedScrollY = window.scrollY;
  const { style } = document.body;
  style.position = "fixed";
  style.top = `-${lockedScrollY}px`;
  style.left = "0";
  style.right = "0";
  style.width = "100%";
}

function unlockScroll() {
  if (--lockCount > 0) return;
  const { style } = document.body;
  style.position = "";
  style.top = "";
  style.left = "";
  style.right = "";
  style.width = "";
  window.scrollTo(0, lockedScrollY);
}

/** Bottom-sheet modal (centered dialog on desktop) for create/edit overlays. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the open/close effects.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Body scroll lock + focus into the dialog, restored on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      unlockScroll();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id={titleId} className="modal-title">{title}</h2>
          <button
            type="button"
            className="btn btn-icon modal-close"
            aria-label="Tanca"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="modal-body app-scroll">{children}</div>
      </div>
    </div>
  );
}

/**
 * Sticky cancel + submit bar for forms inside a Modal. Render it as the last
 * child of the <form>; the submit button submits that form.
 */
export function ModalActions({
  submitLabel,
  pending = false,
  onCancel,
}: {
  submitLabel: ReactNode;
  pending?: boolean;
  onCancel: () => void;
}) {
  return (
    <Row gap={8} className="modal-actions">
      <button type="button" className="btn btn-ghost" onClick={onCancel} style={{ height: 48, flex: "none", padding: "0 16px" }}>
        {t.common.cancel}
      </button>
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ height: 48, flex: 1, fontSize: 16 }}>
        {pending ? t.common.loading : submitLabel}
      </button>
    </Row>
  );
}
