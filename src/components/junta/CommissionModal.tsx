"use client";

import { useState } from "react";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Grid, Stack } from "@/components/ui/Layout";
import { createCommissionAction, updateCommissionAction } from "@/app/(app)/bolos/commission-actions";
import { dateToMonthInput } from "@/lib/domain/commissions";
import { t } from "@/i18n/t";
import type { CommissionWithMembers } from "@/lib/data/commissions";

/** Create / edit a commission. Remount (key) per commission to reset the form. */
export function CommissionModal({
  commission,
  year,
  open,
  onClose,
}: {
  commission: CommissionWithMembers | null;
  year: number;
  open: boolean;
  onClose: () => void;
}) {
  const c = commission;
  const [allYear, setAllYear] = useState(c ? c.starts_on === null : false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = c ? await updateCommissionAction(c.id, fd) : await createCommissionAction(year, fd);
    setPending(false);
    if (res.error) setError(res.error);
    else onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={c ? t.commissions.editTitle : t.commissions.createTitle}>
      <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
        <Field label={t.commissions.name} name="name" required defaultValue={c?.name ?? ""} style={{ height: 48 }} />

        <Field label={t.commissions.kind}>
          <select name="kind" className="input" defaultValue={c?.kind ?? "propia"} style={{ height: 48 }}>
            <option value="propia">{t.commissions.kindPropiaShort}</option>
            <option value="entitats">{t.commissions.kindEntitatsShort}</option>
          </select>
        </Field>

        <Stack gap={8}>
          <div className="caption">{t.commissions.period}</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" name="all_year" checked={allYear} onChange={(e) => setAllYear(e.target.checked)} />
            {t.commissions.allYear}
          </label>
          {!allYear ? (
            <Grid cols={2} gap={8}>
              <Field
                label={t.commissions.starts}
                name="starts_on"
                type="month"
                required
                defaultValue={dateToMonthInput(c?.starts_on ?? null)}
                style={{ height: 48 }}
              />
              <Field
                label={t.commissions.ends}
                name="ends_on"
                type="month"
                required
                defaultValue={dateToMonthInput(c?.ends_on ?? null)}
                style={{ height: 48 }}
              />
            </Grid>
          ) : null}
        </Stack>

        <Field
          label={t.commissions.maxMembers}
          name="max_members"
          type="number"
          min={1}
          defaultValue={c?.max_members?.toString() ?? ""}
          style={{ height: 48 }}
        />

        <Field label={t.commissions.description}>
          <textarea
            name="description"
            rows={4}
            defaultValue={c?.description ?? ""}
            className="input"
            style={{ resize: "vertical", paddingTop: 12, paddingBottom: 12 }}
          />
        </Field>

        <Field label={t.commissions.requirements}>
          <textarea
            name="requirements"
            rows={2}
            defaultValue={c?.requirements ?? ""}
            placeholder={t.commissions.requirementsPlaceholder}
            className="input"
            style={{ resize: "vertical", paddingTop: 12, paddingBottom: 12 }}
          />
        </Field>

        {error ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">{error}</p>
        ) : null}

        <ModalActions submitLabel={t.commissions.save} pending={pending} onCancel={onClose} />
      </form>
    </Modal>
  );
}
