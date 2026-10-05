"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { t } from "@/i18n/t";
import type { AdminMemberItem } from "@/lib/data/members";
import { ListCard, StatusPill, STATUS_CLOSED, STATUS_OPEN, rowTitleStyle, type StatusStyle } from "./parts";

function memberStatusStyle(status: string): StatusStyle {
  if (status === "inactive") return { label: t.member.statusInactive, ...STATUS_CLOSED };
  if (status === "intermittent") return { label: t.member.statusIntermittent, color: "#b45309", bg: "rgba(245,158,11,.12)" };
  return { label: t.member.statusActive, ...STATUS_OPEN };
}

function MemberRow({ member }: { member: AdminMemberItem }) {
  const status = memberStatusStyle(member.member_status);
  return (
    <Link href={`/membres/${member.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="admin-row">
        <Avatar name={member.full_name} url={member.avatar_url} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={rowTitleStyle}>
            {member.full_name}
            {member.nickname ? <span style={{ fontFamily: "var(--font-body)", fontSize: 12, opacity: 0.5, marginLeft: 6, textTransform: "none" }}>«{member.nickname}»</span> : null}
          </div>
          <div className="break-anywhere" style={{ fontSize: 12, opacity: 0.5 }}>{member.email}</div>
        </div>
        <StatusPill {...status} />
      </div>
    </Link>
  );
}

export function MembresTab({ members, resetKey }: { members: AdminMemberItem[]; resetKey: string }) {
  const pag = usePagination(members, 20, "membres" + resetKey);
  return (
    <>
      <ListCard empty={members.length === 0} emptyText={t.junta.noMembers}>
        {pag.pageItems.map((m) => <MemberRow key={m.id} member={m} />)}
      </ListCard>
      <Pagination {...pag} onPrev={pag.prev} onNext={pag.next} />
    </>
  );
}
