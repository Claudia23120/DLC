"use client";

import { useOptimistic, useTransition } from "react";
import { castVote } from "@/app/(app)/reunions/actions";
import type { PollOptionResult } from "@/lib/data/polls";

interface PollVotingProps {
  eventId: string;
  options: PollOptionResult[];
  closed: boolean;
  allowMultiple: boolean;
  secret?: boolean;
}

type OptAction = { optionId: string; allowMultiple: boolean };

export function PollVoting({ eventId, options, closed, allowMultiple, secret }: PollVotingProps) {
  const [, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic(
    options,
    (state, { optionId, allowMultiple: multi }: OptAction) => {
      if (multi) {
        return state.map((o) => o.id === optionId ? { ...o, mine: !o.mine } : o);
      }
      return state.map((o) => ({ ...o, mine: o.id === optionId }));
    },
  );

  const vote = (optionId: string) => {
    if (closed) return;
    startTransition(async () => {
      setOptimistic({ optionId, allowMultiple });
      await castVote(eventId, optionId, allowMultiple);
    });
  };

  const hasVoted = optimistic.some((o) => o.mine);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {allowMultiple && !closed && (
        <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Pots seleccionar més d&apos;una opció.</p>
      )}
      {secret && hasVoted && !closed && (
        <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>Has votat. És una votació secreta, no es mostrarà la teva selecció.</p>
      )}
      {optimistic.map((o) => {
        const highlighted = !secret && o.mine;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => vote(o.id)}
            disabled={closed}
            style={{
              textAlign: "left",
              cursor: closed ? "default" : "pointer",
              border: `1px solid ${highlighted ? "var(--color-accent-500)" : "rgba(32,30,29,.14)"}`,
              borderRadius: 18,
              padding: "14px 16px",
              background: highlighted ? "var(--color-accent-50, rgba(198,47,40,.04))" : "transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, flex: 1, minWidth: 0 }}>{o.label}</span>
              <span style={{ fontSize: 13, opacity: 0.55 }}>{o.pct}%</span>
              <span style={{ fontSize: 13, color: "var(--color-accent-700)", width: 14, textAlign: "right" }}>
                {highlighted ? "✓" : ""}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(32,30,29,.08)", marginTop: 9, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${o.pct}%`, background: highlighted ? "var(--color-accent-500)" : "rgba(32,30,29,.14)", borderRadius: 999 }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
