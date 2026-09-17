"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FocSheet } from "@/components/bolos/FocSheet";
import {
  defaultFocConfig,
  focStorageKey,
  focUid,
  type FocConfig,
  type FocEncesa,
  type FocTaskRow,
  type FocTram,
} from "@/lib/domain/foc";


interface Props {
  eventId: string;
  defaultTitle: string;
  /** All member names, for the pick-a-member datalist (free text still allowed). */
  memberNames: string[];
  /** Names signed up as diable — pre-filled into Cremadors on a fresh sheet. */
  diableNames: string[];
}

/**
 * Admin-only fire sheet editor. Client-only: the config is NOT saved to the
 * database — only mirrored to this browser's localStorage so a reload doesn't
 * lose work. Output is print / PDF via the browser.
 */
export function BoloFocEditor({ eventId, defaultTitle, memberNames, diableNames }: Props) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<FocConfig>(() =>
    defaultFocConfig(defaultTitle, diableNames),
  );
  const loaded = useRef(false);

  // Load any in-progress sheet from this browser once, on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(focStorageKey(eventId));
      if (raw) setConfig(JSON.parse(raw) as FocConfig);
    } catch {
      /* corrupt / unavailable storage → keep defaults */
    }
    loaded.current = true;
  }, [eventId]);

  // Persist to localStorage on every change (after the initial load).
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(focStorageKey(eventId), JSON.stringify(config));
    } catch {
      /* storage full / unavailable → ignore */
    }
  }, [config, eventId]);

  const set = (patch: Partial<FocConfig>) => setConfig((c) => ({ ...c, ...patch }));

  function resetSheet() {
    if (!confirm("Segur que vols buidar tot el full de foc?")) return;
    setConfig(defaultFocConfig(defaultTitle, diableNames));
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => setOpen((v) => !v)}
        style={{ height: 44, fontSize: 14 }}
      >
        Configuració de foc {open ? "▲" : "▼"}
      </button>

      {open ? (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
            Aquest full no es desa a la base de dades: es guarda només en aquest
            navegador. Fes servir «Imprimeix / PDF» per compartir-lo.
          </p>

          {/* — Títol — */}
          <Block label="Títol">
            <input
              className="input"
              value={config.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Correfoc Nadal 2025"
              style={{ height: 34, fontSize: 13, padding: "0 10px" }}
            />
          </Block>

          {/* — Llucifer / Diablessa — */}
          <div style={{ display: "flex", gap: 10 }}>
            <Block label="Llucifer" style={{ flex: 1 }}>
              <AssignInput
                value={config.llucifer}
                options={memberNames.filter((n) => n !== config.diablessa)}
                onChange={(v) => set({ llucifer: v })}
              />
            </Block>
            <Block label="Diablessa" style={{ flex: 1 }}>
              <AssignInput
                value={config.diablessa}
                options={memberNames.filter((n) => n !== config.llucifer)}
                onChange={(v) => set({ diablessa: v })}
              />
            </Block>
          </div>

          {/* — Cremadors — */}
          <Block label="Cremadors">
            <StringList
              items={config.cremadors}
              memberNames={memberNames}
              onChange={(cremadors) => set({ cremadors })}
              addLabel="Afegeix cremador"
            />
          </Block>

          {/* — Trams + Tasques — */}
          <Block label="Trams i tasques">
            <TramsTasksEditor
              trams={config.trams}
              tasks={config.tasks}
              memberNames={memberNames}
              onTrams={(trams) => set({ trams })}
              onTasks={(tasks) => set({ tasks })}
            />
          </Block>

          {/* — Encesses (Lluïments) — */}
          <Block label="Encesses / Lluïments">
            <EncessesEditor
              encesses={config.encesses}
              memberNames={memberNames}
              onChange={(encesses) => set({ encesses })}
            />
          </Block>

          {/* — Responsables material — */}
          <Block label="Responsables material">
            <StringList
              items={config.responsablesMaterial}
              memberNames={memberNames}
              onChange={(responsablesMaterial) => set({ responsablesMaterial })}
              addLabel="Afegeix responsable"
            />
          </Block>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ height: 44, flex: 1 }}
              onClick={() => window.print()}
            >
              Imprimeix / PDF
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ height: 44 }}
              onClick={resetSheet}
            >
              Buida
            </button>
          </div>

          {/* Live preview — this is what gets printed. */}
          <div>
            <h4 style={{ fontSize: 14, margin: "4px 0 8px", opacity: 0.7 }}>Vista prèvia</h4>
            <FocSheet config={config} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── small building blocks ─────────────────────────────────────────────── */

function Block({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: 0.4,
          marginBottom: 6,
          opacity: 0.8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/** Input that suggests members (minus already-used ones) but accepts any free text. */
function AssignInput({
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
        className="input"
        list={listId}
        value={value}
        placeholder={placeholder ?? "Nom o text lliure"}
        onChange={(e) => onChange(e.target.value)}
        style={{ height: 34, fontSize: 13, padding: "0 10px" }}
      />
    </>
  );
}

/** An editable list of assignment strings with add / remove. */
function StringList({
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => {
        const otherPicked = new Set(items.filter((_, j) => j !== i));
        const options = memberNames.filter((n) => !otherPicked.has(n));
        return (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <AssignInput
                value={item}
                options={options}
                onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
              />
            </div>
            <RemoveButton onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </div>
        );
      })}
      <AddButton label={addLabel} onClick={() => onChange([...items, ""])} />
    </div>
  );
}

function TramsTasksEditor({
  trams,
  tasks,
  memberNames,
  onTrams,
  onTasks,
}: {
  trams: FocTram[];
  tasks: FocTaskRow[];
  memberNames: string[];
  onTrams: (t: FocTram[]) => void;
  onTasks: (t: FocTaskRow[]) => void;
}) {
  function addTram() {
    onTrams([...trams, { id: focUid(), name: `Tram ${trams.length + 1}` }]);
  }
  function removeTram(id: string) {
    onTrams(trams.filter((t) => t.id !== id));
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* tram names */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {trams.map((tram, i) => (
          <div key={tram.id} style={{ display: "flex", gap: 6 }}>
            <input
              className="input"
              value={tram.name}
              placeholder={`Tram ${i + 1}`}
              onChange={(e) =>
                onTrams(trams.map((t) => (t.id === tram.id ? { ...t, name: e.target.value } : t)))
              }
              style={{ height: 34, fontSize: 13, padding: "0 10px" }}
            />
            <RemoveButton onClick={() => removeTram(tram.id)} />
          </div>
        ))}
        <AddButton label="Afegeix tram" onClick={addTram} />
      </div>

      {/* task rows — one horizontal row per task: label | tram1 | tram2 | … | ✕ */}
      <div
        style={{
          border: "1px solid rgba(32,30,29,.12)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* header row with tram names */}
        {trams.length > 0 && (
          <div style={{ display: "flex", borderBottom: "1px solid rgba(32,30,29,.1)" }}>
            <div style={{ width: 120, flex: "none", padding: "6px 10px", fontSize: 11, opacity: 0.5 }}>
              Tasca
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
        {tasks.map((row, idx) => (
          <div
            key={row.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              borderBottom: idx < tasks.length - 1 ? "1px solid rgba(32,30,29,.08)" : "none",
            }}
          >
            {/* task label */}
            <div style={{ width: 120, flex: "none", padding: "6px 6px 6px 10px" }}>
              <input
                className="input"
                value={row.label}
                placeholder="Tasca"
                onChange={(e) =>
                  onTasks(
                    tasks.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)),
                  )
                }
                style={{ height: 34, fontSize: 13, fontWeight: 600, padding: "0 8px" }}
              />
            </div>
            {/* one cell per tram — exclude names already used in the same tram column */}
            {trams.map((tram) => {
              const usedInCol = new Set(
                tasks.filter((r) => r.id !== row.id).map((r) => r.cells[tram.id] ?? "").filter(Boolean),
              );
              return (
                <div
                  key={tram.id}
                  style={{ flex: 1, padding: "6px 4px", borderLeft: "1px solid rgba(32,30,29,.08)" }}
                >
                  <AssignInput
                    value={row.cells[tram.id] ?? ""}
                    options={memberNames.filter((n) => !usedInCol.has(n))}
                    onChange={(v) => setCell(row.id, tram.id, v)}
                    placeholder=""
                  />
                </div>
              );
            })}
            <div style={{ width: 34, flex: "none", display: "flex", justifyContent: "center" }}>
              <RemoveButton onClick={() => onTasks(tasks.filter((r) => r.id !== row.id))} />
            </div>
          </div>
        ))}
        <AddButton
          label="Afegeix tasca"
          onClick={() => onTasks([...tasks, { id: focUid(), label: "", cells: {} }])}
        />
      </div>
    </div>
  );
}

function EncessesEditor({
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {encesses.map((e) => (
        <div
          key={e.id}
          style={{
            border: "1px solid rgba(32,30,29,.12)",
            borderRadius: 12,
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="input"
              value={e.name}
              placeholder="Nom (ex. Encesa Final)"
              onChange={(ev) => update(e.id, { name: ev.target.value })}
              style={{ height: 34, fontSize: 13, padding: "0 10px", flex: 1 }}
            />
            <RemoveButton onClick={() => onChange(encesses.filter((x) => x.id !== e.id))} />
          </div>
          <input
            className="input"
            value={e.lloc}
            placeholder="Lloc (ex. Pl. Concòrdia)"
            onChange={(ev) => update(e.id, { lloc: ev.target.value })}
            style={{ height: 34, fontSize: 13, padding: "0 10px" }}
          />
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Qui crema</div>
            <StringList
              items={e.participants}
              memberNames={memberNames}
              onChange={(participants) => update(e.id, { participants })}
              addLabel="Afegeix persona"
            />
          </div>
        </div>
      ))}
      <AddButton
        label="Afegeix encesa"
        onClick={() =>
          onChange([...encesses, { id: focUid(), name: "", lloc: "", participants: [] }])
        }
      />
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={onClick}
      style={{ height: 38, fontSize: 13, alignSelf: "flex-start" }}
    >
      + {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Treure"
      style={{
        flex: "none",
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "1px solid rgba(32,30,29,.15)",
        background: "transparent",
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      ✕
    </button>
  );
}
