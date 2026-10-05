"use client";

import { focUid, type FocTaskRow, type FocTram } from "@/lib/domain/foc";
import { t } from "@/i18n/t";
import { AssignInput } from "./AssignInput";
import { AddButton, RemoveButton } from "./FocButtons";
import { Row, Stack } from "@/components/ui/Layout";

export function TramsTasksEditor({
  trams,
  tasks,
  memberNames,
  onTrams,
  onTasks,
}: {
  trams: FocTram[];
  tasks: FocTaskRow[];
  memberNames: string[];
  onTrams: (next: FocTram[]) => void;
  onTasks: (next: FocTaskRow[]) => void;
}) {
  function addTram() {
    onTrams([...trams, { id: focUid(), name: t.foc.tramN(trams.length + 1) }]);
  }
  function removeTram(id: string) {
    onTrams(trams.filter((x) => x.id !== id));
    // drop that tram's cells from every task
    onTasks(
      tasks.map((row) => {
        const { [id]: _drop, ...rest } = row.cells;
        return { ...row, cells: rest };
      }),
    );
  }
  function setCell(taskId: string, tramId: string, value: string) {
    onTasks(
      tasks.map((row) =>
        row.id === taskId ? { ...row, cells: { ...row.cells, [tramId]: value } } : row,
      ),
    );
  }

  return (
    <Stack gap={14}>
      {/* tram names */}
      <Stack gap={8}>
        {trams.map((tram, i) => (
          <Row key={tram.id} gap={6}>
            <input
              className="input tap-target"
              value={tram.name}
              placeholder={t.foc.tramN(i + 1)}
              onChange={(e) =>
                onTrams(trams.map((x) => (x.id === tram.id ? { ...x, name: e.target.value } : x)))
              }
              style={{ height: 34, fontSize: 13, padding: "0 10px", flex: 1, minWidth: 0 }}
            />
            <RemoveButton onClick={() => removeTram(tram.id)} />
          </Row>
        ))}
        <AddButton label={t.foc.addTram} onClick={addTram} />
      </Stack>

      {/* Tasks. Phones: one card per task. ≥640px: label | tram1 | tram2 | … | ✕ (see .foc-task in globals.css) */}
      <div style={{ border: "1px solid rgba(32,30,29,.12)", borderRadius: 12, overflow: "hidden" }}>
        {trams.length > 0 && (
          <div className="foc-task-head">
            <div style={{ width: 120, flex: "none", padding: "6px 10px", fontSize: 11, opacity: 0.5 }}>
              {t.foc.task}
            </div>
            {trams.map((tram) => (
              <div
                key={tram.id}
                style={{
                  flex: 1,
                  padding: "6px 6px",
                  fontSize: 11,
                  opacity: 0.5,
                  textAlign: "center",
                  borderLeft: "1px solid rgba(32,30,29,.08)",
                }}
              >
                {tram.name}
              </div>
            ))}
            <div style={{ width: 34, flex: "none" }} />
          </div>
        )}
        {tasks.map((row) => (
          <div key={row.id} className="foc-task">
            <div className="foc-task-label">
              <input
                className="input tap-target"
                value={row.label}
                placeholder={t.foc.task}
                onChange={(e) =>
                  onTasks(
                    tasks.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)),
                  )
                }
                style={{ height: 34, fontSize: 13, fontWeight: 600, padding: "0 8px" }}
              />
            </div>
            {/* one cell per tram — exclude names already used in the same tram column */}
            <div className="foc-task-cells">
              {trams.map((tram) => {
                const usedInCol = new Set(
                  tasks.filter((r) => r.id !== row.id).map((r) => r.cells[tram.id] ?? "").filter(Boolean),
                );
                return (
                  <div key={tram.id} className="foc-task-cell">
                    <span className="foc-cell-name">{tram.name}</span>
                    <AssignInput
                      value={row.cells[tram.id] ?? ""}
                      options={memberNames.filter((n) => !usedInCol.has(n))}
                      onChange={(v) => setCell(row.id, tram.id, v)}
                      placeholder=""
                    />
                  </div>
                );
              })}
            </div>
            <div className="foc-task-remove">
              <RemoveButton onClick={() => onTasks(tasks.filter((r) => r.id !== row.id))} />
            </div>
          </div>
        ))}
        <AddButton
          label={t.foc.addTask}
          onClick={() => onTasks([...tasks, { id: focUid(), label: "", cells: {} }])}
        />
      </div>
    </Stack>
  );
}
