"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { signIn, type LoginState } from "./actions";
import { Row } from "@/components/ui/Layout";
import { AuthShell } from "@/components/layout/AuthShell";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { t } from "@/i18n/t";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthShell
      hero={
        <>
          <Image
            src="/logo-white.png"
            alt="Diables de les Corts"
            width={140}
            height={140}
            style={{ objectFit: "contain" }}
            priority
          />
          <p style={{ fontSize: 15, opacity: 0.72, margin: "16px 0 0", maxWidth: 270 }}>{t.app.tagline}</p>
        </>
      }
    >
      <form action={formAction} className="stack" style={{ gap: 12 }}>
        <input
          className="input input-dark"
          type="email"
          name="email"
          required
          placeholder={t.auth.emailPlaceholder}
        />
        <div style={{ position: "relative" }}>
          <input
            className="input input-dark"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            placeholder={t.auth.passwordPlaceholder}
            style={{ paddingRight: 52 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "none", border: "none", cursor: "pointer", color: "rgba(253,236,233,.6)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label={showPassword ? "Amaga la contrasenya" : "Mostra la contrasenya"}
          >
            {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>

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

        <Row justify="between" wrap style={{ marginTop: 4 }}>
          <a href="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>{t.auth.forgotPassword}</a>
          <span style={{ color: "#f2aaa2", fontSize: 13 }}>{t.auth.contactBoard}</span>
        </Row>
      </form>
    </AuthShell>
  );
}
