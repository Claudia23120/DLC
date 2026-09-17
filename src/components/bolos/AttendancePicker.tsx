"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { CarIcon } from "@/components/ui/icons";
import { RESPONSE_META } from "@/lib/domain/events";
import { setBoloAttendance, setOptionSelections } from "@/app/(app)/bolos/actions";
import { t } from "@/i18n/t";
import type { BoloResponse, MemberRole } from "@/types/database";
import type { EventOption } from "@/lib/data/events";

interface AttendancePickerProps {
  eventId: string;
  allowedRoles: MemberRole[];
  askCars: boolean;
  initialResponse: BoloResponse | null;
  initialCar: boolean;
  eventOptions: EventOption[];
  initialOptionResponses: Record<string, string>;
  allowMultipleOptions: boolean;
}

export function AttendancePicker({
  eventId,
  allowedRoles,
  askCars,
  initialResponse,
  initialCar,
  eventOptions,
  initialOptionResponses,
  allowMultipleOptions,
}: AttendancePickerProps) {
  const [response, setResponse] = useState<BoloResponse | null>(initialResponse);
  const [car, setCar] = useState(initialCar);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    Object.entries(initialOptionResponses)
      .filter(([, v]) => v === "true")
      .map(([k]) => k),
  );
  const [, startTransition] = useTransition();

  // When no roles defined, show generic Vinc / No vinc.
  const options: BoloResponse[] = allowedRoles.length > 0 ? [...allowedRoles, "no"] : ["si", "no"];

  const persist = (next: BoloResponse, nextCar: boolean) => {
    startTransition(() => { void setBoloAttendance(eventId, next, nextCar); });
  };

  const pick = (value: BoloResponse) => {
    setResponse(value);
    const nextCar = value === "no" ? false : car;
    setCar(nextCar);
    persist(value, nextCar);
  };

  const toggleCar = (next: boolean) => {
    setCar(next);
    if (response) persist(response, next);
  };

  const toggleOption = (optionId: string) => {
    let next: string[];
    if (allowMultipleOptions) {
      next = selectedIds.includes(optionId)
        ? selectedIds.filter((id) => id !== optionId)
        : [...selectedIds, optionId];
    } else {
      next = selectedIds.includes(optionId) ? [] : [optionId];
    }
    setSelectedIds(next);
    startTransition(() => { void setOptionSelections(eventId, next); });
  };

  const showExtras = !!response && response !== "no";
  const hasOptions = eventOptions.length > 0;

  return (
    <div>
      <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.boloDetail.areYouComing}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {options.map((opt) => {
          const meta = RESPONSE_META[opt];
          const active = response === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => pick(opt)}
              style={{
                borderRadius: 999,
                height: 52,
                cursor: "pointer",
                fontFamily: "var(--font-heading)",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: active ? meta.dot : "rgba(32,30,29,.22)",
                background: active ? meta.bg : "transparent",
                color: active ? meta.color : "var(--color-text)",
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {showExtras ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {askCars ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
              <CarIcon size={22} stroke="var(--color-sage-500)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{t.boloDetail.bringCar}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {car ? "Pots portar gent al bolo" : "Indica si pots portar gent"}
                </div>
              </div>
              <Toggle checked={car} onChange={toggleCar} label={t.boloDetail.bringCar} />
            </div>
          ) : null}

          {hasOptions ? (
            <div>
              <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 8, paddingLeft: 4 }}>
                {allowMultipleOptions ? "Escull les opcions que t'apliquen" : "Escull una opció"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {eventOptions.map((opt) => {
                  const selected = selectedIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(opt.id)}
                      style={{
                        borderRadius: 999,
                        height: 44,
                        padding: "0 20px",
                        cursor: "pointer",
                        fontFamily: "var(--font-heading)",
                        fontSize: 14,
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: selected ? "var(--color-accent-500)" : "rgba(32,30,29,.22)",
                        background: selected ? "var(--color-accent-100)" : "transparent",
                        color: selected ? "var(--color-accent-800)" : "var(--color-text)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {selectedIds.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-muted-text)", marginTop: 8, paddingLeft: 4 }}>
                  Vinc com a opcio al detall per escollir
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
