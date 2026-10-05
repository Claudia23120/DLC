import { t } from "@/i18n/t";
import { FlameIcon } from "@/components/ui/icons";
import { Stack } from "@/components/ui/Layout";

export default function CompteInactiu() {
  return (
    <Stack
      gap={16}
      className="min-screen"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "env(safe-area-inset-top, 0px) 32px env(safe-area-inset-bottom, 0px)",
        background: "var(--color-accent-900)",
        color: "#f6ece0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          background: "var(--color-accent-700)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <FlameIcon size={36} stroke="#fdece9" />
      </div>
      <h1
        style={{
          fontFamily: "var(--font-anton)",
          fontSize: 32,
          textTransform: "uppercase",
          margin: 0,
          color: "#fdece9",
        }}
      >
        {t.inactiveAccount.title}
      </h1>
      <p style={{ fontSize: 15, opacity: 0.75, maxWidth: 300, margin: 0 }}>
        {t.inactiveAccount.message}
      </p>
      <a
        href="mailto:junta@diableslescorts.cat"
        className="auth-link"
        style={{ marginTop: 8, color: "#f2aaa2" }}
      >
        {t.inactiveAccount.contactBoard}
      </a>
    </Stack>
  );
}
