"use client";

import { t } from "@/i18n/t";
import type { MemberListItem } from "@/lib/data/members";

interface PadriSelectorProps {
  name: string;
  label: string;
  members: MemberListItem[];
  currentId: string | null;
  selfId: string;
}

export function PadriSelector({ name, label, members, currentId, selfId }: PadriSelectorProps) {
  const others = members.filter((m) => m.id !== selfId);

  return (
    <div className="field">
      <label>{label}</label>
      <select name={name} className="input" defaultValue={currentId ?? ""} style={{ height: 48 }}>
        <option value="">— Sense padrí —</option>
        {others.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}{m.nickname ? ` «${m.nickname}»` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
