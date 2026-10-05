"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "./actions";
import { AuthIcon, AuthShell } from "@/components/layout/AuthShell";
import { t } from "@/i18n/t";

const initial: ResetPasswordState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, initial);

  return (
    <AuthShell
      hero={
        <>
          <AuthIcon />
          <h1 style={{ fontSize: 36, margin: "28px 0 8px", color: "#fdece9", lineHeight: 1.05 }}>
            {t.auth.resetPasswordTitle}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.72, margin: 0, maxWidth: 300 }}>
            {t.auth.resetPasswordIntro}
          </p>
        </>
      }
    >
      <form action={formAction} className="stack" style={{ gap: 12 }}>
        <input
          className="input input-dark"
          type="password"
          name="password"
          required
          placeholder={t.auth.newPassword}
        />
        <input
          className="input input-dark"
          type="password"
          name="confirm"
          required
          placeholder={t.auth.confirmPassword}
        />

        {state.error ? (
          <p style={{ margin: 0, fontSize: 13, color: "#f2aaa2" }} role="alert">{state.error}</p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending}
          style={{ height: 54, fontSize: 17, marginTop: 8, background: "var(--color-accent-500)" }}
        >
          {pending ? t.common.loading : t.auth.resetPasswordCta}
        </button>
      </form>
    </AuthShell>
  );
}
