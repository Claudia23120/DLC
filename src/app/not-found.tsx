import Link from "next/link";
import { AuthIcon, AuthShell } from "@/components/layout/AuthShell";

export default function NotFound() {
  return (
    <AuthShell
      bottomPad={48}
      hero={
        <>
          <AuthIcon />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 96, lineHeight: 1, margin: "20px 0 0", color: "rgba(253,236,233,.15)" }}>
            404
          </div>
          <h1 style={{ fontSize: 36, margin: "8px 0 10px", color: "#fdece9", lineHeight: 1.05 }}>
            Pàgina no trobada
          </h1>
          <p style={{ fontSize: 15, opacity: 0.65, margin: 0, maxWidth: 300 }}>
            Aquesta pàgina no existeix o has perdut el fil.
          </p>
        </>
      }
    >
      <Link
        href="/bolos"
        className="btn btn-primary btn-block"
        style={{ height: 54, fontSize: 17, margin: 0, background: "var(--color-accent-500)", textDecoration: "none" }}
      >
        Torna als bolos
      </Link>
    </AuthShell>
  );
}
