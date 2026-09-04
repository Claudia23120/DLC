"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { createBadgeAction, type CreateBadgeState } from "@/app/(app)/colla/badge-actions";
import { t } from "@/i18n/t";

const initial: CreateBadgeState = {};

export function CreateBadgeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createBadgeAction, initial);

  return (
    <Modal open={open} onClose={onClose} title={t.create.newBadge}>
      {state.ok ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 15, color: "var(--color-sage-800)" }}>
            Insígnia creada correctament.
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={onClose} style={{ height: 48 }}>
            {t.common.done}
          </button>
        </div>
      ) : (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nom" name="name" required placeholder="Nom de la insígnia" style={{ height: 48 }} />
          <Field label="Descripció" name="description" placeholder="Descripció breu" style={{ height: 48 }} />
          <Field label="Icona (emoji)" name="icon" placeholder="🏅" defaultValue="🏅" style={{ height: 48 }} />

          <div className="field">
            <label>Tipus</label>
            <select name="type" className="input" defaultValue="manual" style={{ height: 48 }}>
              <option value="manual">Manual</option>
              <option value="repte">Repte</option>
            </select>
          </div>

          <Field label="Patró del repte (paraula clau al títol del bolo)" name="repte_pattern" placeholder="p.ex. Correfoc" style={{ height: 48 }} />

          {state.error ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">
              {state.error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={pending} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
            {pending ? t.common.loading : t.create.newBadge}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose} style={{ height: 44 }}>
            {t.common.cancel}
          </button>
        </form>
      )}
    </Modal>
  );
}
