"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/app/(app)/perfil/actions";
import { t } from "@/i18n/t";

const initial: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initial);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 20, margin: 0 }}>{t.profile.changePassword}</h3>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          className="input"
          type="password"
          name="password"
          placeholder={t.auth.newPassword}
          style={{ height: 48 }}
          autoComplete="new-password"
        />
        <input
          className="input"
          type="password"
          name="confirm"
          placeholder={t.auth.confirmPassword}
          style={{ height: 48 }}
          autoComplete="new-password"
        />
        {state.ok ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-sage-800)" }}>{t.profile.passwordChanged}</p>
        ) : null}
        {state.error ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">{state.error}</p>
        ) : null}
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={pending}
          style={{ height: 48 }}
        >
          {pending ? t.common.loading : t.profile.changePassword}
        </button>
      </form>
    </section>
  );
}
