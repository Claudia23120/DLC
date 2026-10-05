"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { BoloOptionsAdmin } from "@/components/bolos/BoloOptionsAdmin";
import { updateEventAction, type UpdateEventState } from "@/app/(app)/junta/actions";
import { RolePicker, EVENT_ROLES } from "@/components/bolos/RolePicker";
import { toInputDate, toInputDateTime, toInputTime } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { EventRow } from "@/lib/data/events";
import type { MemberRole } from "@/types/database";
import { Grid } from "@/components/ui/Layout";

const initial: UpdateEventState = {};
export function EditEventModal({
  event,
  open,
  onClose,
}: {
  event: EventRow;
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateEventAction, initial);

  const defaultDate = toInputDate(event.starts_at);
  const defaultTime = toInputTime(event.starts_at);
  const defaultRoles = new Set<MemberRole>(event.allowed_roles ?? EVENT_ROLES);
  const [roles, setRoles] = useState<Record<MemberRole, boolean>>({
    diable: defaultRoles.has("diable"),
    tabaler: defaultRoles.has("tabaler"),
    supporter: defaultRoles.has("supporter"),
  });
  const [askCars, setAskCars] = useState(event.ask_cars ?? true);
  const [askSizes, setAskSizes] = useState(event.ask_sizes ?? true);
  const [allowMultiple, setAllowMultiple] = useState(event.allow_multiple_options ?? false);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(event.allow_multiple_votes ?? false);
  const [secretVote, setSecretVote] = useState(event.secret_vote ?? false);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const title =
    event.kind === "bolo"
      ? t.create.editBolo
      : event.kind === "event"
      ? t.create.editMeeting
      : t.create.editPoll;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={formAction} className="stack" style={{ gap: 14 }}>
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
            <Grid cols={2} gap={10}>
              <Field label={t.create.date} name="date" type="date" defaultValue={defaultDate} style={{ height: 48 }} />
              <Field label={t.create.time} name="time" type="time" defaultValue={defaultTime} style={{ height: 48 }} />
            </Grid>
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

            <RolePicker roles={roles} onChange={setRoles} />

            <ToggleRow label={t.create.askCars} checked={askCars} onChange={setAskCars} name="ask_cars" />
            <ToggleRow label={t.create.askSizes} checked={askSizes} onChange={setAskSizes} name="ask_sizes" />
            <ToggleRow label={t.create.allowMultipleOptions} checked={allowMultiple} onChange={setAllowMultiple} name="allow_multiple_options" />
            <BoloOptionsAdmin eventId={event.id} />
          </>
        ) : null}

        {event.kind === "event" ? (
          <>
            <Field label={t.create.affects} name="affects" defaultValue={event.affects ?? t.create.defaultAffects} style={{ height: 48 }} />
            <Field label={t.meetings.agenda} name="agenda" defaultValue={event.agenda ?? ""} style={{ height: 48 }} />
            <Field label={t.meetings.actaUrl} name="acta_url" defaultValue={event.acta_url ?? ""} placeholder={t.meetings.actaPlaceholder} style={{ height: 48 }} />
          </>
        ) : null}

        {event.kind === "votacio" ? (
          <>
            <RichTextEditor name="description" label={t.create.description} defaultValue={event.description ?? ""} />
            <Field
              label={t.polls.closesOn}
              name="closes_at"
              type="datetime-local"
              defaultValue={toInputDateTime(event.closes_at)}
              style={{ height: 48 }}
            />
            <ToggleRow label={t.create.allowMultipleOptions} checked={allowMultipleVotes} onChange={setAllowMultipleVotes} name="allow_multiple_votes" />
            <ToggleRow label={t.create.secretVote} checked={secretVote} onChange={setSecretVote} name="secret_vote" />
          </>
        ) : null}

        {state.error ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <ModalActions submitLabel={t.create.saveChanges} pending={pending} onCancel={onClose} />
      </form>
    </Modal>
  );
}
