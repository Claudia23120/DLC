"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { addComment } from "@/app/(app)/bolos/actions";
import { t } from "@/i18n/t";
import type { CommentItem } from "@/lib/data/events";

export function CommentSection({ eventId, comments }: { eventId: string; comments: CommentItem[] }) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    startTransition(() => {
      void addComment(eventId, text);
    });
    inputRef.current?.focus();
  };

  return (
    <div>
      <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.boloDetail.comments}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 10 }}>
            <Avatar name={c.author_name} size={36} bg="var(--color-sand-200)" color="var(--color-sand-800)" />
            <div style={{ flex: 1, background: "var(--color-surface)", borderRadius: 20, borderTopLeftRadius: 6, padding: "10px 14px", boxShadow: "var(--shadow-sm)" }}>
              <strong style={{ fontSize: 13 }}>{c.author_name}</strong>
              <div style={{ fontSize: 14, marginTop: 2 }}>{c.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <input
          ref={inputRef}
          className="input"
          placeholder={t.boloDetail.writeComment}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ flex: 1, height: 46 }}
        />
        <button type="button" className="btn btn-primary" onClick={submit} disabled={pending} style={{ width: 46, height: 46, padding: 0, flex: "none" }}>
          <ArrowRightIcon size={20} />
        </button>
      </div>
    </div>
  );
}
