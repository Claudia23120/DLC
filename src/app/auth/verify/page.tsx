import { AuthIcon, AuthShell } from "@/components/layout/AuthShell";
import { safeNextPath } from "@/lib/utils/safe-redirect";
import { t } from "@/i18n/t";

// Only the email flows that land here.
const ALLOWED_TYPES = ["recovery", "invite"];

/**
 * Landing page for email links (password reset, invitation). It does NOT
 * consume the one-time token: mail scanners that pre-open links would burn it.
 * The token is verified only when the person presses the button, which POSTs
 * to /auth/confirm.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;
  const valid = Boolean(token_hash) && ALLOWED_TYPES.includes(type ?? "");
  const invite = type === "invite";

  return (
    <AuthShell
      hero={
        <>
          <AuthIcon />
          <h1 style={{ fontSize: 36, margin: "28px 0 8px", color: "#fdece9", lineHeight: 1.05 }}>
            {invite ? t.auth.verifyInviteTitle : t.auth.verifyResetTitle}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.72, margin: 0, maxWidth: 300 }}>
            {valid ? t.auth.verifyIntro : t.auth.linkInvalid}
          </p>
        </>
      }
    >
      {valid ? (
        <form method="POST" action="/auth/confirm" className="stack" style={{ gap: 12 }}>
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={safeNextPath(next ?? null)} />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: 54, fontSize: 17, background: "var(--color-accent-500)" }}
          >
            {t.auth.verifyCta}
          </button>
        </form>
      ) : (
        <a href="/forgot-password" className="auth-link">{t.auth.forgotPassword}</a>
      )}
    </AuthShell>
  );
}
