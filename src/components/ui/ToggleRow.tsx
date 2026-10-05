"use client";

import { Toggle } from "@/components/ui/Toggle";
import { Row } from "@/components/ui/Layout";

/** A labelled toggle row that also submits its value via a hidden input. */
export function ToggleRow({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  name: string;
}) {
  return (
    <Row gap={12} style={{ padding: "12px 16px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-heading)", fontSize: 15 }}>{label}</div>
      <Toggle checked={checked} onChange={onChange} label={label} />
      {checked ? <input type="hidden" name={name} value="on" /> : null}
    </Row>
  );
}
