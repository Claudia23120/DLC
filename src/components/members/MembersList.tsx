"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { CreateMemberModal } from "./CreateMemberModal";
import { boardPositionLabel } from "@/lib/utils/labels";
import { t } from "@/i18n/t";
import type { MemberListItem } from "@/lib/data/members";

export function MembersList({ members, isAdmin }: { members: MemberListItem[]; isAdmin: boolean }) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = members.filter((m) =>
    `${m.full_name} ${m.nickname ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  const pag = usePagination(filtered, 20, search);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {isAdmin ? (
        <button type="button" className="btn btn-primary btn-block" onClick={() => setCreateOpen(true)} style={{ height: 48 }}>
          {t.colla.createMember}
        </button>
      ) : null}

      <Input placeholder={t.colla.searchMember} value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: 46 }} />

      {pag.pageItems.map((m) => (
        <Link
          key={m.id}
          href={`/membres/${m.id}`}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--color-surface)", borderRadius: 24, boxShadow: "var(--shadow-sm)", textDecoration: "none", color: "inherit" }}
        >
          <Avatar name={m.full_name} url={m.avatar_url} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{m.full_name}</span>
              {m.nickname ? <span style={{ fontSize: 12, opacity: 0.5 }}>«{m.nickname}»</span> : null}
            </div>
          </div>
          {m.board_position ? (
            <Tag variant="accent" style={{ flex: "none", fontSize: 10 }}>{boardPositionLabel(m.board_position)}</Tag>
          ) : null}
        </Link>
      ))}

      {filtered.length === 0 ? <p className="text-muted">{t.common.empty}</p> : null}
      <Pagination {...pag} onPrev={pag.prev} onNext={pag.next} />

      {isAdmin ? <CreateMemberModal open={createOpen} onClose={() => setCreateOpen(false)} /> : null}
    </div>
  );
}
