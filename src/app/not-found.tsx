import Link from "next/link";
import { FlameIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 32px 48px",
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
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 96, lineHeight: 1, margin: "20px 0 0", color: "rgba(253,236,233,.15)" }}>
          404
        </div>
        <h1 style={{ fontSize: 36, margin: "8px 0 10px", color: "#fdece9", lineHeight: 1.05 }}>
          Pàgina no trobada
        </h1>
        <p style={{ fontSize: 15, opacity: 0.65, margin: 0, maxWidth: 300 }}>
          Aquesta pàgina no existeix o has perdut el fil.
        </p>
      </div>

      <Link
        href="/bolos"
        className="btn btn-primary btn-block"
        style={{ height: 54, fontSize: 17, background: "var(--color-accent-500)", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        Torna als bolos
      </Link>
    </div>
  );
}
