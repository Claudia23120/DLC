"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveEventOption, deleteEventOption } from "@/app/(app)/bolos/actions";
import type { EventOption } from "@/lib/data/events";

interface Props {
  eventId: string;
}

export function BoloOptionsAdmin({ eventId }: Props) {
  const [options, setOptions] = useState<EventOption[]>([]);
  const [label, setLabel] = useState("");
  const [, startTransition] = useTransition();

  const fetchOptions = () => {
    const supabase = createClient();
    supabase
      .from("event_options")
      .select("*")
      .eq("event_id", eventId)
      .order("position", { ascending: true })
      .then(({ data }) => setOptions(data ?? []));
  };

  useEffect(() => { fetchOptions(); }, [eventId]);

  const add = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setLabel("");
    startTransition(async () => {
      await saveEventOption(eventId, trimmed, "boolean");
      fetchOptions();
    });
  };

  const remove = (optionId: string) => {
    startTransition(async () => {
      await deleteEventOption(optionId, eventId);
      fetchOptions();
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.55 }}>
        Opcions personalitzades
      </div>

      {options.map((opt) => (
        <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ flex: 1, fontSize: 14 }}>{opt.label}</span>
          <button
            type="button"
            onClick={() => remove(opt.id)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, opacity: 0.5, lineHeight: 1 }}
            aria-label="Elimina"
          >
            ×
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Nova pregunta (ex: Portes cadira?)"
          style={{ flex: 1, height: 44, borderRadius: 999, padding: "0 16px", fontSize: 14, border: "1px solid rgba(32,30,29,.22)", background: "var(--color-surface)" }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!label.trim()}
          className="btn btn-primary"
          style={{ height: 44, paddingInline: 18, borderRadius: 999, fontSize: 14 }}
        >
          Afegeix
        </button>
      </div>
    </div>
  );
}
