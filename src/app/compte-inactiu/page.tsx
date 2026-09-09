import { t } from "@/i18n/t";
import { FlameIcon } from "@/components/ui/icons";

export default function CompteInactiu() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 32px",
        background: "var(--color-accent-900)",
        color: "#f6ece0",
        textAlign: "center",
        gap: 16,
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
        href={`mailto:junta@diableslescorts.cat`}
        style={{
          marginTop: 8,
          fontSize: 14,
          color: "#f2aaa2",
          textDecoration: "none",
        }}
      >
        {t.inactiveAccount.contactBoard}
      </a>
    </div>
  );
}
