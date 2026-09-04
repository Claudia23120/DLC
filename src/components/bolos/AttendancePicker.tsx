"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { CarIcon } from "@/components/ui/icons";
import { RESPONSE_META } from "@/lib/domain/events";
import { setBoloAttendance } from "@/app/(app)/bolos/actions";
import { t } from "@/i18n/t";
import type { BoloResponse, MemberRole } from "@/types/database";

interface AttendancePickerProps {
  eventId: string;
  allowedRoles: MemberRole[];
  askCars: boolean;
  initialResponse: BoloResponse | null;
  initialCar: boolean;
}

export function AttendancePicker({
  eventId,
  allowedRoles,
  askCars,
  initialResponse,
  initialCar,
}: AttendancePickerProps) {
  const [response, setResponse] = useState<BoloResponse | null>(initialResponse);
  const [car, setCar] = useState(initialCar);
  const [, startTransition] = useTransition();

  // Allowed roles + always the "no vinc" option.
  const options: BoloResponse[] = [...allowedRoles, "no"];

  const persist = (next: BoloResponse, nextCar: boolean) => {
    startTransition(() => {
      void setBoloAttendance(eventId, next, nextCar);
    });
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

  const showCar = askCars && !!response && response !== "no";

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

      {showCar ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "14px 18px", borderRadius: 999, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
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
    </div>
  );
}
