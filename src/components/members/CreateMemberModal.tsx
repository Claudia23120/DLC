"use client";

import { useActionState, useState } from "react";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { createMemberAction, type CreateMemberState } from "@/app/(app)/colla/actions";
import { t } from "@/i18n/t";
import type { BoardPosition, MemberStatus } from "@/types/database";
import { Row } from "@/components/ui/Layout";

const initial: CreateMemberState = {};
const BOARD_POSITIONS: BoardPosition[] = [
  "presidenta", "vicepresidenta", "secretaria", "tresorera", "cap_de_foc", "cap_de_tabals",
];
const MEMBER_STATUSES: { value: MemberStatus; label: string }[] = [
  { value: "active", label: t.member.statusActive },
  { value: "inactive", label: t.member.statusInactive },
  { value: "intermittent", label: t.member.statusIntermittent },
];

export function CreateMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createMemberAction, initial);
  const [formKey, setFormKey] = useState(0);

  const reset = () => {
    setFormKey((k) => k + 1);
  };

  return (
    <Modal open={open} onClose={onClose} title={t.create.newMember}>
      {state.ok ? (
        <Card style={{ padding: 16, gap: 10 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{t.create.memberCreated}</div>
          <div className="break-anywhere" style={{ fontSize: 14 }}>{t.create.inviteSentTo(state.email ?? "")}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{t.create.inviteNote}</div>
          <Row gap={8} style={{ marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={reset} style={{ flex: 1, height: 44 }}>
              {t.create.createAnother}
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose} style={{ flex: 1, height: 44 }}>
              {t.common.done}
            </button>
          </Row>
        </Card>
      ) : (
        <form key={formKey} action={formAction} className="stack" style={{ gap: 14 }}>
          <Field label={t.profile.fullName} name="full_name" required placeholder="Nom Cognoms" style={{ height: 48 }} />
          <Field label={t.profile.nickname} name="nickname" placeholder="Puigrí" style={{ height: 48 }} />
          <Field label={t.profile.email} name="email" type="email" required placeholder="nom@diableslescorts.cat" style={{ height: 48 }} />
          <Field label={t.profile.phone} name="phone" placeholder="600 00 00 00" style={{ height: 48 }} />
          <Field label="Data d'entrada" name="joined_date" type="date" style={{ height: 48 }} />

          <div className="field">
            <label>{t.create.boardPosition}</label>
            <select name="board_position" className="input" defaultValue="" style={{ height: 48 }}>
              <option value="">{t.create.noBoardPosition}</option>
              {BOARD_POSITIONS.map((p) => (
                <option key={p} value={p}>{t.boardPositions[p]}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{t.member.memberStatus}</label>
            <select name="member_status" className="input" defaultValue="active" style={{ height: 48 }}>
              {MEMBER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="check-row">
              <input type="checkbox" name="has_cre" />
              {t.member.hasCre}
            </label>
            <label className="check-row">
              <input type="checkbox" name="has_rgcre" />
              {t.member.hasRgcre}
            </label>
          </div>

          {state.error ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">{state.error}</p>
          ) : null}

          <ModalActions submitLabel={t.create.createMemberCta} pending={pending} onCancel={onClose} />
        </form>
      )}
    </Modal>
  );
}
