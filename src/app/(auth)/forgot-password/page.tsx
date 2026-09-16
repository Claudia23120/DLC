"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";
import { FlameIcon } from "@/components/ui/icons";
import { t } from "@/i18n/t";

const initial: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initial);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 32px 40px",
        background: "var(--color-accent-900)",
        color: "#f6ece0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -120, right: -90, width: 320, height: 320, borderRadius: "50%", background: "var(--color-accent-700)" }} />
      <div style={{ position: "absolute", top: 70, left: -70, width: 180, height: 180, borderRadius: "50%", background: "var(--color-accent-600)", opacity: 0.55 }} />

      <div style={{ position: "relative", marginBottom: "auto", marginTop: 96 }}>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--color-accent-500)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>
          <FlameIcon size={40} stroke="#fdece9" />
        </div>
        <h1 style={{ fontSize: 36, margin: "28px 0 8px", color: "#fdece9", lineHeight: 1.05 }}>
          {t.auth.forgotPasswordTitle}
        </h1>
        <p style={{ fontSize: 15, opacity: 0.72, margin: 0, maxWidth: 300 }}>
          {t.auth.forgotPasswordIntro}
        </p>
      </div>

      <div style={{ position: "relative", marginTop: 40, width: "100%", maxWidth: 460, alignSelf: "center" }}>
        {state.sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 15, color: "#fdece9", margin: 0, lineHeight: 1.5 }}>
              {t.auth.forgotPasswordSent}
            </p>
            <a
              href="/login"
              style={{ fontSize: 14, color: "rgba(253,236,233,.7)", textDecoration: "none" }}
            >
              ← {t.auth.backToLogin}
            </a>
          </div>
        ) : (
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              className="input"
              type="email"
              name="email"
              required
              placeholder={t.auth.emailPlaceholder}
              style={{ background: "rgba(253,236,233,.08)", borderColor: "rgba(253,236,233,.28)", color: "#fdece9", height: 52, fontSize: 15 }}
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
              {pending ? t.common.loading : t.auth.forgotPasswordCta}
            </button>

            <a
              href="/login"
              style={{ fontSize: 14, color: "rgba(253,236,233,.7)", textDecoration: "none", marginTop: 4, textAlign: "center" }}
            >
              ← {t.auth.backToLogin}
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
