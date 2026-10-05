"use client";

import { RESPONSE_META } from "@/lib/domain/events";
import { t } from "@/i18n/t";
import type { MemberRole } from "@/types/database";
import { Row } from "@/components/ui/Layout";

export const EVENT_ROLES: MemberRole[] = ["diable", "tabaler", "supporter"];

/** "Who can join" pills (diable / tabaler / supporter) + hidden `role_*` inputs for the form. */
export function RolePicker({
  roles,
  onChange,
}: {
  roles: Record<MemberRole, boolean>;
  onChange: (next: Record<MemberRole, boolean>) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6 }}>
        {t.create.whoCanJoin}
      </div>
      <Row gap={8}>
        {EVENT_ROLES.map((r) => {
          const on = roles[r];
          const meta = RESPONSE_META[r];
          return (
            <button
              key={r}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ ...roles, [r]: !on })}
              style={{
                flex: 1,
                minWidth: 0,
                height: 46,
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "var(--font-heading)",
                fontSize: 14,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: on ? meta.dot : "rgba(32,30,29,.22)",
                background: on ? meta.bg : "transparent",
                color: on ? meta.color : "var(--color-text)",
              }}
            >
              {meta.label} {on ? "✓" : ""}
            </button>
          );
        })}
      </Row>
      {EVENT_ROLES.filter((r) => roles[r]).map((r) => (
        <input key={r} type="hidden" name={`role_${r}`} value="on" />
      ))}
    </div>
  );
}
