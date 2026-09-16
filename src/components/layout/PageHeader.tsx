"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/Avatar";

interface PageHeaderProps {
  kicker: string;
  title: string;
  /** Show a back button that pops the history stack. */
  showBack?: boolean;
  /** Name for the mobile avatar shortcut to the profile. */
  userName?: string;
}

/** Shared page header: kicker + title, optional back button, mobile avatar. */
export function PageHeader({ kicker, title, showBack = false, userName }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="page-header">
      {showBack ? (
        <button
          type="button"
          className="btn btn-icon"
          aria-label="Enrere"
          onClick={() => router.back()}
          style={{ background: "rgba(253,236,233,.15)", color: "#fdece9", border: "none", width: 40, height: 40, flex: "none" }}
        >
          <ChevronLeftIcon size={20} />
        </button>
      ) : null}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.6 }}>
          {kicker}
        </div>
        <h2 style={{ fontSize: 26, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "inherit" }}>
          {title}
        </h2>
      </div>

      {userName ? (
        <Link href="/perfil" className="mobile-only" style={{ flex: "none" }} aria-label="Perfil">
          <Avatar name={userName} size={42} />
        </Link>
      ) : null}
    </div>
  );
}
