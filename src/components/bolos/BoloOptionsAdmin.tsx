"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveEventOption, deleteEventOption } from "@/app/(app)/bolos/actions";
import { t } from "@/i18n/t";
import type { EventOption } from "@/lib/data/events";
import { Row, Stack } from "@/components/ui/Layout";

interface Props {
  eventId: string;
}

export function BoloOptionsAdmin({ eventId }: Props) {
  const [options, setOptions] = useState<EventOption[]>([]);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchOptions = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("event_options")
      .select("*")
      .eq("event_id", eventId)
      .order("position", { ascending: true });
    if (fetchError) {
      setError(t.create.optionsLoadError);
      return;
    }
    setError(null);
    setOptions(data ?? []);
  }, [eventId]);

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  const add = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setLabel("");
    startTransition(async () => {
      await saveEventOption(eventId, trimmed, "boolean");
      await fetchOptions();
    });
  };

  const remove = (optionId: string) => {
    startTransition(async () => {
      await deleteEventOption(optionId, eventId);
      await fetchOptions();
    });
  };

  return (
    <Stack gap={8}>
      <div className="caption">
        {t.create.customOptions}
      </div>

      {error ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-500)" }} role="alert">
          {error}
        </p>
      ) : null}

      {options.map((opt) => (
        <Row key={opt.id} gap={10} style={{ padding: "10px 14px", borderRadius: 12, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
          <span className="break-anywhere" style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{opt.label}</span>
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

      <Row gap={8}>
        <input
          type="text"
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={t.create.newQuestionPlaceholder}
          style={{ flex: 1, minWidth: 0, height: 44 }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!label.trim()}
          className="btn btn-primary"
          style={{ height: 44, paddingInline: 18, borderRadius: 999, fontSize: 14 }}
        >
          {t.create.add}
        </button>
      </Row>
    </Stack>
  );
}
