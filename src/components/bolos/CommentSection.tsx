"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { addComment } from "@/app/(app)/bolos/actions";
import { t } from "@/i18n/t";
import type { CommentItem } from "@/lib/data/events";
import { Row, Stack } from "@/components/ui/Layout";

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
      <Stack gap={12}>
        {comments.map((c) => (
          <Row key={c.id} gap={10} align="start">
            <Avatar name={c.author_name} size={36} bg="var(--color-sand-200)" color="var(--color-sand-800)" />
            <div style={{ flex: 1, minWidth: 0, background: "var(--color-surface)", borderRadius: 20, borderTopLeftRadius: 6, padding: "10px 14px", boxShadow: "var(--shadow-sm)" }}>
              <strong style={{ fontSize: 13 }}>{c.author_name}</strong>
              <div className="break-anywhere" style={{ fontSize: 14, marginTop: 2 }}>{c.body}</div>
            </div>
          </Row>
        ))}
      </Stack>

      <Row gap={8} style={{ marginTop: 14 }}>
        <input
          ref={inputRef}
          className="input"
          placeholder={t.boloDetail.writeComment}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ flex: 1, minWidth: 0, height: 46 }}
        />
        <button type="button" className="btn btn-primary" onClick={submit} disabled={pending} style={{ width: 46, height: 46, padding: 0, flex: "none" }}>
          <ArrowRightIcon size={20} />
        </button>
      </Row>
    </div>
  );
}
