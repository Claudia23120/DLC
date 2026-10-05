"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { adminSetBoloAttendance } from "@/app/(app)/bolos/actions";
import { RESPONSE_META } from "@/lib/domain/events";
import { t } from "@/i18n/t";
import type { Signup } from "@/lib/data/events";
import type { MemberListItem } from "@/lib/data/members";
import type { BoloResponse, MemberRole } from "@/types/database";

const RESPONSE_LABELS: Record<string, string> = {
  diable: "D",
  tabaler: "T",
  supporter: "S",
  no: "No",
};

interface Props {
  eventId: string;
  allowedRoles: MemberRole[];
  allMembers: MemberListItem[];
  signups: Signup[];
}

export function BoloAttendanceAdmin({ eventId, allowedRoles, allMembers, signups }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const signupMap = new Map<string, BoloResponse>(signups.map((s) => [s.member_id, s.response]));
  const [localMap, setLocalMap] = useState(new Map(signupMap));

  const filtered = allMembers.filter((m) =>
    `${m.full_name} ${m.nickname ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  const visibleResponses: (BoloResponse | null)[] = [
    ...(allowedRoles as BoloResponse[]),
    "no",
    null,
  ];

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => setOpen((v) => !v)}
        style={{ height: 44, fontSize: 14 }}
      >
        {t.boloDetail.manageAttendance} {open ? "▲" : "▼"}
      </button>

      {open ? (
        <div className="surface-card" style={{ marginTop: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 8px" }}>
            <input
              className="input"
              placeholder={t.colla.searchMember}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: 40, fontSize: 14 }}
            />
          </div>
          {filtered.map((m) => (
            <MemberAttendanceRow
              key={m.id}
              member={m}
              eventId={eventId}
              current={localMap.get(m.id) ?? null}
              visibleResponses={visibleResponses}
              onChange={(r) => {
                const next = new Map(localMap);
                if (r === null) next.delete(m.id);
                else next.set(m.id, r);
                setLocalMap(next);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MemberAttendanceRow({
  member,
  eventId,
  current,
  visibleResponses,
  onChange,
}: {
  member: MemberListItem;
  eventId: string;
  current: BoloResponse | null;
  visibleResponses: (BoloResponse | null)[];
  onChange: (r: BoloResponse | null) => void;
}) {
  const [pending, startTransition] = useTransition();

  function set(r: BoloResponse | null) {
    onChange(r);
    startTransition(() => { adminSetBoloAttendance(eventId, member.id, r); });
  }

  return (
    <div className="att-row" style={{ opacity: pending ? 0.6 : 1 }}>
      <Avatar name={member.full_name} url={member.avatar_url} size={32} />
      <div className="att-name">
        <div style={{ fontSize: 13, fontFamily: "var(--font-heading)", textTransform: "uppercase", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {member.full_name}
        </div>
      </div>
      <div className="att-buttons">
        {visibleResponses.map((r, i) => {
          const isNull = r === null;
          const active = isNull ? current === null && !pending : current === r;
          const meta = r ? RESPONSE_META[r] : null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => set(r)}
              disabled={pending}
              className="att-btn"
              style={{
                borderColor: active && meta ? meta.dot : active ? "rgba(32,30,29,.3)" : "rgba(32,30,29,.15)",
                background: active && meta ? meta.bg : active ? "rgba(32,30,29,.08)" : "transparent",
                color: active && meta ? meta.color : "var(--color-text)",
              }}
              title={isNull ? t.boloDetail.removeAttendance : (r ? RESPONSE_META[r].label : "")}
            >
              {isNull ? "✕" : RESPONSE_LABELS[r ?? ""] ?? r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
