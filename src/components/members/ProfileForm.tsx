"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { PadriSelector } from "./PadriSelector";
import { updateProfile, type ProfileFormState } from "@/app/(app)/perfil/actions";
import { t } from "@/i18n/t";
import type { MemberRow, MemberListItem } from "@/lib/data/members";

const SIZE_OPTIONS = ["P", "P+", "M", "M+", "G"];
const initial: ProfileFormState = {};

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function asBool(v: unknown): boolean {
  return v === true;
}

export function ProfileForm({
  profile,
  allMembers,
}: {
  profile: MemberRow;
  allMembers?: MemberListItem[];
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);

  const sizes = profile.sizes as Record<string, unknown>;
  const gear = profile.gear_needs as Record<string, unknown>;

  const [casaca, setCasaca] = useState(asString(sizes.casaca));
  const [pantalo, setPantalo] = useState(asString(sizes.pantalo));
  const [tabaler, setTabaler] = useState(asString(sizes.tabaler));
  const [ownFoc, setOwnFoc] = useState(asBool(sizes.own_suit_foc));
  const [ownTabaler, setOwnTabaler] = useState(asBool(sizes.own_suit_tabaler));
  const [guants, setGuants] = useState(asBool(gear.guants));
  const [ulleres, setUlleres] = useState(asBool(gear.ulleres));

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ fontSize: 20, margin: 0 }}>{t.profile.personalData}</h3>
        <Field label={t.profile.fullName} name="full_name" defaultValue={profile.full_name} style={{ height: 48 }} />
        <Field label={t.profile.nickname} name="nickname" defaultValue={profile.nickname ?? ""} style={{ height: 48 }} />
        <Field label={t.profile.phone} name="phone" defaultValue={profile.phone ?? ""} style={{ height: 48 }} />
        <Field label={t.profile.email} name="email_display" defaultValue={profile.email} disabled style={{ height: 48, opacity: 0.6 }} />
        <Field label={t.profile.emergencyContact} name="emergency_contact" defaultValue={profile.emergency_contact ?? ""} style={{ height: 48 }} />
        <Field label={t.profile.medicalNotes} name="medical_notes" defaultValue={profile.medical_notes ?? ""} style={{ height: 48 }} />
        <div className="field">
          <label>Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={3}
            className="input"
            style={{ resize: "vertical", paddingTop: 12, paddingBottom: 12 }}
          />
        </div>
      </section>

      {allMembers && allMembers.length > 0 ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontSize: 20, margin: 0 }}>{t.member.godparents}</h3>
          <PadriSelector
            name="padri_foc_id"
            label="Padrí/madrina de foc"
            members={allMembers}
            currentId={profile.padri_foc_id}
            selfId={profile.id}
          />
          <PadriSelector
            name="padri_tabal_id"
            label="Padrí/madrina de tabal"
            members={allMembers}
            currentId={profile.padri_tabal_id}
            selfId={profile.id}
          />
        </section>
      ) : null}

      <section>
        <h3 style={{ fontSize: 20, marginBottom: 4 }}>{t.profile.suitSize}</h3>
        <p style={{ fontSize: 13, opacity: 0.6, margin: "0 0 12px" }}>{t.profile.suitSizeIntro}</p>

        <ToggleRow label={t.profile.ownSuitFoc} checked={ownFoc} onChange={setOwnFoc} name="own_suit_foc" />
        {!ownFoc ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "12px 0" }}>
            <SizeRow title={t.profile.casaca} value={casaca} onChange={setCasaca} name="size_casaca" />
            <SizeRow title={t.profile.pantalo} value={pantalo} onChange={setPantalo} name="size_pantalo" />
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <ToggleRow label={t.profile.ownSuitTabaler} checked={ownTabaler} onChange={setOwnTabaler} name="own_suit_tabaler" />
        </div>
        {!ownTabaler ? (
          <div style={{ margin: "12px 0" }}>
            <SizeRow title={t.profile.tabalerPant} value={tabaler} onChange={setTabaler} name="size_tabaler" />
          </div>
        ) : null}

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55 }}>{t.profile.clubGear}</div>
          <ToggleRow label={t.profile.guants} checked={guants} onChange={setGuants} name="gear_guants" />
          <ToggleRow label={t.profile.ulleres} checked={ulleres} onChange={setUlleres} name="gear_ulleres" />
        </div>
      </section>

      {state.ok ? <p style={{ margin: 0, fontSize: 13, color: "var(--color-sage-800)" }}>{t.profile.saved}</p> : null}
      {state.error ? <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">{state.error}</p> : null}

      <button type="submit" className="btn btn-primary btn-block" disabled={pending} style={{ height: 52, fontSize: 16 }}>
        {pending ? t.common.loading : t.common.save}
      </button>
    </form>
  );
}

function SizeRow({ title, value, onChange, name }: { title: string; value: string; onChange: (v: string) => void; name: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {SIZE_OPTIONS.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(active ? "" : s)}
              style={{
                flex: 1,
                height: 46,
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
              {s}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function ToggleRow({ label, checked, onChange, name }: { label: string; checked: boolean; onChange: (v: boolean) => void; name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: 15 }}>{label}</div>
      <Toggle checked={checked} onChange={onChange} label={label} />
      {checked ? <input type="hidden" name={name} value="on" /> : null}
    </div>
  );
}
