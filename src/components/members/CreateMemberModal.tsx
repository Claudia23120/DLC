"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { createMemberAction, type CreateMemberState } from "@/app/(app)/colla/actions";
import { RESPONSE_META } from "@/lib/domain/events";
import { t } from "@/i18n/t";
import type { BoardPosition, MemberRole, MemberStatus } from "@/types/database";

const initial: CreateMemberState = {};
const ROLES: MemberRole[] = ["diable", "tabaler", "supporter"];
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
  const [roles, setRoles] = useState<Record<MemberRole, boolean>>({ diable: true, tabaler: false, supporter: false });
  const [formKey, setFormKey] = useState(0);

  const reset = () => {
    setRoles({ diable: true, tabaler: false, supporter: false });
    setFormKey((k) => k + 1);
  };

  return (
    <Modal open={open} onClose={onClose} title={t.create.newMember}>
      {state.ok ? (
        <Card style={{ padding: 16, gap: 10 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{t.create.memberCreated}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>{t.create.tempPasswordIntro}</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 18, padding: "10px 14px", background: "var(--color-bg)", borderRadius: 12, letterSpacing: ".04em" }}>
            {state.tempPassword}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{t.create.tempPasswordNote}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={reset} style={{ flex: 1, height: 44 }}>
              {t.create.createAnother}
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose} style={{ flex: 1, height: 44 }}>
              {t.common.done}
            </button>
          </div>
        </Card>
      ) : (
        <form key={formKey} action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label={t.profile.fullName} name="full_name" required placeholder="Nom Cognoms" style={{ height: 48 }} />
          <Field label={t.profile.nickname} name="nickname" placeholder="Puigrí" style={{ height: 48 }} />
          <Field label={t.profile.email} name="email" type="email" required placeholder="nom@diableslescorts.cat" style={{ height: 48 }} />
          <Field label={t.profile.phone} name="phone" placeholder="600 00 00 00" style={{ height: 48 }} />
          <Field label="Data d'entrada" name="joined_date" type="date" style={{ height: 48 }} />

          <div>
            <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6 }}>
              {t.create.roles}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {ROLES.map((r) => {
                const on = roles[r];
                const meta = RESPONSE_META[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoles((s) => ({ ...s, [r]: !s[r] }))}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 999,
                      cursor: "pointer",
                      fontFamily: "var(--font-heading)",
                      fontSize: 14,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: on ? meta.dot : "rgba(32,30,29,.22)",
                      background: on ? meta.bg : "transparent",
                      color: on ? meta.color : "var(--color-text)",
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {ROLES.filter((r) => roles[r]).map((r) => (
              <input key={r} type="hidden" name={`role_${r}`} value="on" />
            ))}
          </div>

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

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" name="has_cre" style={{ width: 18, height: 18 }} />
              {t.member.hasCre}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" name="has_rgcre" style={{ width: 18, height: 18 }} />
              {t.member.hasRgcre}
            </label>
          </div>

          {state.error ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">{state.error}</p>
          ) : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={pending} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
            {pending ? t.common.loading : t.create.createMemberCta}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose} style={{ height: 44 }}>
            {t.common.cancel}
          </button>
        </form>
      )}
    </Modal>
  );
}
