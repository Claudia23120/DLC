"use client";

import { useActionState, useState, useId } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createEventAction, type CreateEventState } from "@/app/(app)/bolos/actions";
import { RESPONSE_META } from "@/lib/domain/events";
import { t } from "@/i18n/t";
import type { EventKind, MemberRole } from "@/types/database";

const initial: CreateEventState = {};
const KIND_TABS: { value: EventKind; label: string }[] = [
  { value: "bolo", label: t.kinds.bolo },
  { value: "event", label: t.kinds.reunio },
  { value: "votacio", label: t.kinds.votacio },
];
const ROLES: MemberRole[] = ["diable", "tabaler", "supporter"];

export function CreateEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createEventAction, initial);
  const [kind, setKind] = useState<EventKind>("bolo");
  const [roles, setRoles] = useState<Record<MemberRole, boolean>>({ diable: true, tabaler: true, supporter: true });
  const [askCars, setAskCars] = useState(true);
  const [askSizes, setAskSizes] = useState(true);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);

  const title =
    kind === "bolo" ? t.create.newBolo : kind === "event" ? t.create.newMeeting : t.create.newPoll;
  const cta = kind === "votacio" ? t.create.openPoll : t.create.publishAndNotify;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="kind" value={kind} />

        {/* Kind selector */}
        <div style={{ display: "flex", gap: 8 }}>
          {KIND_TABS.map((k) => {
            const active = kind === k.value;
            return (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "var(--font-heading)",
                  fontSize: 14,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: active ? "var(--color-accent-500)" : "rgba(32,30,29,.22)",
                  background: active ? "var(--color-accent-500)" : "transparent",
                  color: active ? "#fff" : "var(--color-text)",
                }}
              >
                {k.label}
              </button>
            );
          })}
        </div>

        {/* Common: title / question */}
        <Field
          label={kind === "votacio" ? t.create.question : t.create.title}
          name="title"
          required
          placeholder={kind === "votacio" ? "Quin disseny de samarreta?" : "Correfoc de Festa Major"}
          style={{ height: 48 }}
        />

        {/* Bolo & reunió: date/time/place */}
        {kind !== "votacio" ? (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <Field label={t.create.date} name="date" type="date" wrapperClassName="" style={{ height: 48 }} />
              <Field label={t.create.time} name="time" type="time" style={{ height: 48 }} />
            </div>
            <Field label={kind === "bolo" ? t.create.meetingPoint : t.create.place} name="location" style={{ height: 48 }} />
          </>
        ) : null}

        {/* Bolo-specific */}
        {kind === "bolo" ? (
          <>
            <Field label={t.create.organizer} name="organizer" style={{ height: 48 }} />
            <RichTextEditor name="description" label={t.create.description} />
            <Field label={t.create.routeLink} name="map_url" placeholder="https://" style={{ height: 48 }} />

            <div>
              <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6 }}>
                {t.create.whoCanJoin}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {ROLES.map((r) => {
                  const on = roles[r];
                  const meta = RESPONSE_META[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoles((s) => ({ ...s, [r]: !s[r] }))}
                      style={{
                        flex: 1,
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
              </div>
              {ROLES.filter((r) => roles[r]).map((r) => (
                <input key={r} type="hidden" name={`role_${r}`} value="on" />
              ))}
            </div>

            <ToggleRow label={t.create.askCars} checked={askCars} onChange={setAskCars} name="ask_cars" />
            <ToggleRow label={t.create.askSizes} checked={askSizes} onChange={setAskSizes} name="ask_sizes" />

            <CustomOptions />
          </>
        ) : null}

        {/* Reunió-specific */}
        {kind === "event" ? (
          <>
            <Field label={t.create.affects} name="affects" defaultValue="Tota la colla" style={{ height: 48 }} />
            <Field label={t.meetings.agenda} name="agenda" style={{ height: 48 }} />
          </>
        ) : null}

        {/* Votació-specific */}
        {kind === "votacio" ? (
          <>
            {options.map((opt, i) => (
              <Field
                key={i}
                label={`Opció ${i + 1}`}
                name="option"
                value={opt}
                onChange={(e) => setOptions((s) => s.map((o, j) => (j === i ? e.target.value : o)))}
                placeholder={`Proposta ${String.fromCharCode(65 + i)}`}
                style={{ height: 48 }}
              />
            ))}
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setOptions((s) => [...s, ""])} style={{ height: 44 }}>
              {t.polls.addOption}
            </button>
            <Field label={t.polls.closesOn} name="closes_at" type="datetime-local" style={{ height: 48 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: 15 }}>Permet seleccionar múltiples opcions</div>
              <Toggle checked={allowMultipleVotes} onChange={setAllowMultipleVotes} label="Permet seleccionar múltiples opcions" />
              {allowMultipleVotes ? <input type="hidden" name="allow_multiple_votes" value="on" /> : null}
            </div>
          </>
        ) : null}

        {state.error ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={pending} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
          {pending ? t.common.loading : cta}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onClose} style={{ height: 44 }}>
          {t.common.cancel}
        </button>
      </form>
    </Modal>
  );
}

function CustomOptions() {
  const [opts, setOpts] = useState<string[]>([]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const baseId = useId();

  const add = () => setOpts((s) => [...s, ""]);
  const remove = (i: number) => setOpts((s) => s.filter((_, j) => j !== i));
  const update = (i: number, v: string) => setOpts((s) => s.map((o, j) => (j === i ? v : o)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55 }}>
        Opcions personalitzades
      </div>
      {opts.map((opt, i) => (
        <div key={`${baseId}-${i}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            name="custom_option"
            value={opt}
            onChange={(e) => update(i, e.target.value)}
            placeholder="Ex: Portes cadira?"
            style={{ flex: 1, height: 44, borderRadius: 999, padding: "0 16px", fontSize: 14, border: "1px solid rgba(32,30,29,.22)", background: "var(--color-surface)" }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, opacity: 0.5, lineHeight: 1, flex: "none" }}
            aria-label="Elimina"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-block" onClick={add} style={{ height: 44 }}>
        + Afegeix opció
      </button>
      {opts.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: 15 }}>Permet seleccionar múltiples</div>
          <Toggle checked={allowMultiple} onChange={setAllowMultiple} label="Selecció múltiple" />
          {allowMultiple ? <input type="hidden" name="allow_multiple_options" value="on" /> : null}
        </div>
      ) : null}
    </div>
  );
}

/** A labelled toggle row that also submits its value via a hidden input. */
function ToggleRow({
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: 15 }}>{label}</div>
      <Toggle checked={checked} onChange={onChange} label={label} />
      {checked ? <input type="hidden" name={name} value="on" /> : null}
    </div>
  );
}
