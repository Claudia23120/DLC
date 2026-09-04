"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { FlameIcon } from "@/components/ui/icons";
import { t } from "@/i18n/t";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

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
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -120, right: -90, width: 320, height: 320, borderRadius: "50%", background: "var(--color-accent-700)" }} />
      <div style={{ position: "absolute", top: 70, left: -70, width: 180, height: 180, borderRadius: "50%", background: "var(--color-accent-600)", opacity: 0.55 }} />

      <div style={{ position: "relative", marginBottom: "auto", marginTop: 96 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "var(--color-accent-500)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <FlameIcon size={40} stroke="#fdece9" />
        </div>
        <h1 style={{ fontSize: 44, margin: "28px 0 8px", color: "#fdece9", lineHeight: 1.02 }}>
          Diables
          <br />
          de les Corts
        </h1>
        <p style={{ fontSize: 15, opacity: 0.72, margin: 0, maxWidth: 270 }}>{t.app.tagline}</p>
      </div>

      <form
        action={formAction}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 40,
          width: "100%",
          maxWidth: 460,
          alignSelf: "center",
        }}
      >
        <input
          className="input"
          type="email"
          name="email"
          required
          placeholder={t.auth.emailPlaceholder}
          style={{ background: "rgba(253,236,233,.08)", borderColor: "rgba(253,236,233,.28)", color: "#fdece9", height: 52, fontSize: 15 }}
        />
        <input
          className="input"
          type="password"
          name="password"
          required
          placeholder={t.auth.passwordPlaceholder}
          style={{ background: "rgba(253,236,233,.08)", borderColor: "rgba(253,236,233,.28)", color: "#fdece9", height: 52, fontSize: 15 }}
        />

        {state.error ? (
          <p style={{ margin: 0, fontSize: 13, color: "#f2aaa2" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending}
          style={{ height: 54, fontSize: 17, marginTop: 8, background: "var(--color-accent-500)" }}
        >
          {pending ? t.common.loading : t.auth.signIn}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ color: "rgba(253,236,233,.7)", fontSize: 13 }}>{t.auth.forgotPassword}</span>
          <span style={{ color: "#f2aaa2", fontSize: 13 }}>{t.auth.contactBoard}</span>
        </div>
      </form>
    </div>
  );
}
