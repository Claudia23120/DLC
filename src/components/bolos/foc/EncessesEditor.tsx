"use client";

import { focUid, type FocEncesa } from "@/lib/domain/foc";
import { t } from "@/i18n/t";
import { StringList } from "./StringList";
import { AddButton, RemoveButton } from "./FocButtons";
import { Row, Stack } from "@/components/ui/Layout";

export function EncessesEditor({
  encesses,
  memberNames,
  onChange,
}: {
  encesses: FocEncesa[];
  memberNames: string[];
  onChange: (next: FocEncesa[]) => void;
}) {
  function update(id: string, patch: Partial<FocEncesa>) {
    onChange(encesses.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  return (
    <Stack gap={10}>
      {encesses.map((e) => (
        <Stack
          key={e.id}
          gap={8}
          style={{ border: "1px solid rgba(32,30,29,.12)", borderRadius: 12, padding: 10 }}
        >
          <Row gap={6}>
            <input
              className="input tap-target"
              value={e.name}
              placeholder={t.foc.encesaNamePlaceholder}
              onChange={(ev) => update(e.id, { name: ev.target.value })}
              style={{ height: 34, fontSize: 13, padding: "0 10px", flex: 1, minWidth: 0 }}
            />
            <RemoveButton onClick={() => onChange(encesses.filter((x) => x.id !== e.id))} />
          </Row>
          <input
            className="input tap-target"
            value={e.lloc}
            placeholder={t.foc.llocPlaceholder}
            onChange={(ev) => update(e.id, { lloc: ev.target.value })}
            style={{ height: 34, fontSize: 13, padding: "0 10px" }}
          />
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>{t.foc.whoBurns}</div>
            <StringList
              items={e.participants}
              memberNames={memberNames}
              onChange={(participants) => update(e.id, { participants })}
              addLabel={t.foc.addPerson}
            />
          </div>
        </Stack>
      ))}
      <AddButton
        label={t.foc.addEncesa}
        onClick={() =>
          onChange([...encesses, { id: focUid(), name: "", lloc: "", participants: [] }])
        }
      />
    </Stack>
  );
}
