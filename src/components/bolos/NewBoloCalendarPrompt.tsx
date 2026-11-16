"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Row } from "@/components/ui/Layout";
import { t } from "@/i18n/t";

/** Shown right after a bolo is created: offers to add it to Google Calendar. */
export function NewBoloCalendarPrompt({ googleHref }: { googleHref: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <Card style={{ padding: 16, gap: 10 }}>
      <strong>{t.boloDetail.googlePromptTitle}</strong>
      <Row gap={10} wrap>
        <a
          className="btn btn-primary btn-sm"
          href={googleHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
        >
          {t.boloDetail.googlePromptYes}
        </a>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
          {t.boloDetail.googlePromptNo}
        </button>
      </Row>
    </Card>
  );
}
