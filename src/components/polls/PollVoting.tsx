"use client";

import { useOptimistic, useTransition } from "react";
import { castVote } from "@/app/(app)/reunions/actions";
import type { PollOptionResult } from "@/lib/data/polls";

interface PollVotingProps {
  eventId: string;
  options: PollOptionResult[];
  closed: boolean;
}

/** Poll options with live results; click to vote (unless closed). */
export function PollVoting({ eventId, options, closed }: PollVotingProps) {
  const [, startTransition] = useTransition();
  // Optimistically mark the chosen option while the vote is written.
  const [optimistic, setOptimistic] = useOptimistic(
    options,
    (state, chosenId: string) => state.map((o) => ({ ...o, mine: o.id === chosenId })),
  );

  const vote = (optionId: string) => {
    if (closed) return;
    startTransition(async () => {
      setOptimistic(optionId);
      await castVote(eventId, optionId);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {optimistic.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => vote(o.id)}
          disabled={closed}
          style={{
            textAlign: "left",
            cursor: closed ? "default" : "pointer",
            border: `1px solid ${o.mine ? "var(--color-accent-500)" : "rgba(32,30,29,.14)"}`,
            borderRadius: 18,
            padding: "14px 16px",
            background: "transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, flex: 1, minWidth: 0 }}>{o.label}</span>
            <span style={{ fontSize: 13, opacity: 0.55 }}>{o.pct}%</span>
            <span style={{ fontSize: 13, color: "var(--color-accent-700)", width: 14, textAlign: "right" }}>
              {o.mine ? "✓" : ""}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(32,30,29,.08)", marginTop: 9, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${o.pct}%`, background: o.mine ? "var(--color-accent-500)" : "rgba(32,30,29,.14)", borderRadius: 999 }} />
          </div>
        </button>
      ))}
    </div>
  );
}
