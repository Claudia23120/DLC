"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { updateEventAction, type UpdateEventState } from "@/app/(app)/junta/actions";
import { RESPONSE_META } from "@/lib/domain/events";
import { madridParts } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { EventListItem } from "@/lib/data/events";
import type { MemberRole } from "@/types/database";

const initial: UpdateEventState = {};
const ROLES: MemberRole[] = ["diable", "tabaler", "supporter"];

function startsAtToInputs(startsAt: string | null) {
  if (!startsAt) return { date: "", time: "" };
  const { year, month, day, hour, minute } = madridParts(startsAt);
  return {
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function closesAtToInput(closesAt: string | null): string {
  if (!closesAt) return "";
  const { year, month, day, hour, minute } = madridParts(closesAt);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function EditEventModal({
  event,
  open,
  onClose,
}: {
  event: EventListItem;
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateEventAction, initial);

  const { date: defaultDate, time: defaultTime } = startsAtToInputs(event.starts_at);
  const defaultRoles = new Set<MemberRole>(event.allowed_roles ?? ROLES);
  const [roles, setRoles] = useState<Record<MemberRole, boolean>>({
    diable: defaultRoles.has("diable"),
    tabaler: defaultRoles.has("tabaler"),
    supporter: defaultRoles.has("supporter"),
  });
  const [askCars, setAskCars] = useState(event.ask_cars ?? true);
  const [askSizes, setAskSizes] = useState(event.ask_sizes ?? true);
  const [allowMultiple, setAllowMultiple] = useState(event.allow_multiple_options ?? false);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const title =
    event.kind === "bolo"
      ? t.create.editBolo
      : event.kind === "reunio"
      ? t.create.editMeeting
      : t.create.editPoll;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="event_id" value={event.id} />
        <input type="hidden" name="kind" value={event.kind} />

        <Field
          label={event.kind === "votacio" ? t.create.question : t.create.title}
          name="title"
          required
          defaultValue={event.title}
          style={{ height: 48 }}
        />

        {event.kind !== "votacio" ? (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <Field label={t.create.date} name="date" type="date" defaultValue={defaultDate} style={{ height: 48 }} />
              <Field label={t.create.time} name="time" type="time" defaultValue={defaultTime} style={{ height: 48 }} />
            </div>
            <Field
              label={event.kind === "bolo" ? t.create.meetingPoint : t.create.place}
              name="location"
              defaultValue={event.location ?? ""}
              style={{ height: 48 }}
            />
          </>
        ) : null}

        {event.kind === "bolo" ? (
          <>
            <Field label={t.create.organizer} name="organizer" defaultValue={event.organizer ?? ""} style={{ height: 48 }} />
            <RichTextEditor name="description" label={t.create.description} defaultValue={event.description ?? ""} />
            <Field label={t.create.routeLink} name="map_url" defaultValue={event.map_url ?? ""} placeholder="https://" style={{ height: 48 }} />

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
                        flex: 1, height: 46, borderRadius: 999, cursor: "pointer",
                        fontFamily: "var(--font-heading)", fontSize: 14,
                        borderWidth: 1, borderStyle: "solid",
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
            <ToggleRow label="Permet seleccionar múltiples opcions" checked={allowMultiple} onChange={setAllowMultiple} name="allow_multiple_options" />
          </>
        ) : null}

        {event.kind === "reunio" ? (
          <>
            <Field label={t.create.affects} name="affects" defaultValue={event.affects ?? "Tota la colla"} style={{ height: 48 }} />
            <Field label={t.meetings.agenda} name="agenda" defaultValue={event.agenda ?? ""} style={{ height: 48 }} />
            <Field label={t.meetings.actaUrl} name="acta_url" defaultValue={event.acta_url ?? ""} placeholder={t.meetings.actaPlaceholder} style={{ height: 48 }} />
          </>
        ) : null}

        {event.kind === "votacio" ? (
          <Field
            label={t.polls.closesOn}
            name="closes_at"
            type="datetime-local"
            defaultValue={closesAtToInput(event.closes_at)}
            style={{ height: 48 }}
          />
        ) : null}

        {state.error ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={pending} style={{ height: 52, fontSize: 16, marginTop: 4 }}>
          {pending ? t.common.loading : t.create.saveChanges}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onClose} style={{ height: 44 }}>
          {t.common.cancel}
        </button>
      </form>
    </Modal>
  );
}

function ToggleRow({
  label, checked, onChange, name,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; name: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: 15 }}>{label}</div>
      <Toggle checked={checked} onChange={onChange} label={label} />
      {checked ? <input type="hidden" name={name} value="on" /> : null}
    </div>
  );
}
