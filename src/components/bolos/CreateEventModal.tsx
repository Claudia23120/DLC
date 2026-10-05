"use client";

import { useActionState, useState } from "react";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createEventAction, type CreateEventState } from "@/app/(app)/bolos/actions";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { RolePicker } from "@/components/bolos/RolePicker";
import { t } from "@/i18n/t";
import type { EventKind, MemberRole } from "@/types/database";
import { Grid, Row, Stack } from "@/components/ui/Layout";
import { Input } from "@/components/ui/Input";

const initial: CreateEventState = {};
let optSeq = 0;
const newOpt = () => ({ id: `opt-${++optSeq}`, value: "" });
const KIND_TABS: { value: EventKind; label: string }[] = [
  { value: "bolo", label: t.kinds.bolo },
  { value: "event", label: t.kinds.reunio },
  { value: "votacio", label: t.kinds.votacio },
];

export function CreateEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createEventAction, initial);
  const [kind, setKind] = useState<EventKind>("bolo");
  const [roles, setRoles] = useState<Record<MemberRole, boolean>>({ diable: true, tabaler: true, supporter: true });
  const [askCars, setAskCars] = useState(true);
  const [askSizes, setAskSizes] = useState(true);
  const [options, setOptions] = useState<{ id: string; value: string }[]>(() => [newOpt(), newOpt()]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [secretVote, setSecretVote] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const title =
    kind === "bolo" ? t.create.newBolo : kind === "event" ? t.create.newMeeting : t.create.newPoll;
  const cta = kind === "votacio" ? t.create.openPoll : t.create.publishAndNotify;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={formAction} className="stack" style={{ gap: 14 }}>
        <input type="hidden" name="kind" value={kind} />

        {/* Kind selector */}
        <Row gap={8}>
          {KIND_TABS.map((k) => (
            <button key={k.value} type="button" className="pill-toggle" aria-pressed={kind === k.value} onClick={() => setKind(k.value)}>
              {k.label}
            </button>
          ))}
        </Row>

        {/* Common: title / question */}
        <Field
          label={kind === "votacio" ? t.create.question : t.create.title}
          name="title"
          required
          placeholder={kind === "votacio" ? t.create.pollQuestionPlaceholder : t.create.boloTitlePlaceholder}
          style={{ height: 48 }}
        />

        {/* Bolo & reunió: date/time/place */}
        {kind !== "votacio" ? (
          <>
            <Grid cols={2} gap={10}>
              <Field label={t.create.date} name="date" type="date" style={{ height: 48 }} />
              <Field label={t.create.time} name="time" type="time" style={{ height: 48 }} />
            </Grid>
            <Field label={kind === "bolo" ? t.create.meetingPoint : t.create.place} name="location" style={{ height: 48 }} />
          </>
        ) : null}

        {/* Bolo-specific */}
        {kind === "bolo" ? (
          <>
            <Field label={t.create.organizer} name="organizer" style={{ height: 48 }} />
            <RichTextEditor name="description" label={t.create.description} />
            <Field label={t.create.routeLink} name="map_url" placeholder="https://" style={{ height: 48 }} />

            <RolePicker roles={roles} onChange={setRoles} />

            <ToggleRow label={t.create.askCars} checked={askCars} onChange={setAskCars} name="ask_cars" />
            <ToggleRow label={t.create.askSizes} checked={askSizes} onChange={setAskSizes} name="ask_sizes" />

            <CustomOptions />
          </>
        ) : null}

        {/* Reunió-specific */}
        {kind === "event" ? (
          <>
            <Field label={t.create.affects} name="affects" defaultValue={t.create.defaultAffects} style={{ height: 48 }} />
            <Field label={t.meetings.agenda} name="agenda" style={{ height: 48 }} />
          </>
        ) : null}

        {/* Votació-specific */}
        {kind === "votacio" ? (
          <>
            <RichTextEditor name="description" label={t.create.description} />
            {options.map((opt, i) => (
              <Field
                key={opt.id}
                label={t.create.optionN(i + 1)}
                name="option"
                value={opt.value}
                onChange={(e) => setOptions((s) => s.map((o, j) => (j === i ? { ...o, value: e.target.value } : o)))}
                placeholder={t.create.proposalN(String.fromCharCode(65 + i))}
                style={{ height: 48 }}
              />
            ))}
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setOptions((s) => [...s, newOpt()])} style={{ height: 44 }}>
              {t.polls.addOption}
            </button>
            <Field label={t.polls.closesOn} name="closes_at" type="datetime-local" style={{ height: 48 }} />
            <ToggleRow label={t.create.allowMultipleOptions} checked={allowMultipleVotes} onChange={setAllowMultipleVotes} name="allow_multiple_votes" />
            <ToggleRow label={t.create.secretVote} checked={secretVote} onChange={setSecretVote} name="secret_vote" />
          </>
        ) : null}

        <ToggleRow label={t.create.notifyByEmail} checked={sendEmail} onChange={setSendEmail} name="send_email" />

        {state.error ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <ModalActions submitLabel={cta} pending={pending} onCancel={onClose} />
      </form>
    </Modal>
  );
}

function CustomOptions() {
  const [opts, setOpts] = useState<{ id: string; value: string }[]>([]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const add = () => setOpts((s) => [...s, newOpt()]);
  const remove = (id: string) => setOpts((s) => s.filter((o) => o.id !== id));
  const update = (id: string, v: string) => setOpts((s) => s.map((o) => (o.id === id ? { ...o, value: v } : o)));

  return (
    <Stack gap={8}>
      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55 }}>
        {t.create.customOptions}
      </div>
      {opts.map((opt) => (
        <Row key={opt.id} gap={8}>
          <Input
            type="text"
            name="custom_option"
            value={opt.value}
            onChange={(e) => update(opt.id, e.target.value)}
            placeholder={t.create.customOptionPlaceholder}
            style={{ flex: 1, minWidth: 0, height: 44 }}
          />
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => remove(opt.id)}
            style={{ fontSize: 20, opacity: 0.6, lineHeight: 1, flex: "none" }}
            aria-label={t.create.remove}
          >
            ×
          </button>
        </Row>
      ))}
      <button type="button" className="btn btn-secondary btn-block" onClick={add} style={{ height: 44 }}>
        {t.create.addCustomOption}
      </button>
      {opts.length > 0 ? (
        <ToggleRow label={t.create.allowMultipleShort} checked={allowMultiple} onChange={setAllowMultiple} name="allow_multiple_options" />
      ) : null}
    </Stack>
  );
}
