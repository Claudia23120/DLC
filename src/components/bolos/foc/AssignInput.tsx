"use client";

import { useId } from "react";
import { t } from "@/i18n/t";

/** Input that suggests members (minus already-used ones) but accepts any free text. */
export function AssignInput({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  /** Member names to show as suggestions. Pass already-filtered list to exclude used ones. */
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const listId = useId();
  return (
    <>
      <datalist id={listId}>
        {options.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <input
        className="input tap-target"
        list={listId}
        value={value}
        placeholder={placeholder ?? t.foc.assignPlaceholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ height: 34, fontSize: 13, padding: "0 10px" }}
      />
    </>
  );
}
