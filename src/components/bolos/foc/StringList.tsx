"use client";

import { AssignInput } from "./AssignInput";
import { AddButton, RemoveButton } from "./FocButtons";
import { Row, Stack } from "@/components/ui/Layout";

/** An editable list of assignment strings with add / remove. */
export function StringList({
  items,
  memberNames,
  onChange,
  addLabel,
}: {
  items: string[];
  memberNames: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
}) {
  return (
    <Stack gap={8}>
      {items.map((item, i) => {
        const otherPicked = new Set(items.filter((_, j) => j !== i));
        const options = memberNames.filter((n) => !otherPicked.has(n));
        return (
          <Row key={i} gap={6}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <AssignInput
                value={item}
                options={options}
                onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
              />
            </div>
            <RemoveButton onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </Row>
        );
      })}
      <AddButton label={addLabel} onClick={() => onChange([...items, ""])} />
    </Stack>
  );
}
