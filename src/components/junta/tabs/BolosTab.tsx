"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { setCancelledAction } from "@/app/(app)/junta/actions";
import { formatShortDate, isPast } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { EventListItem } from "@/lib/data/events";
import {
  ActionBtn, DeleteEventBtn, ListCard, StatusPill, STATUS_CLOSED, STATUS_OPEN, type StatusStyle,
} from "./parts";

function boloStatus(event: EventListItem): StatusStyle {
  if (event.cancelled) return { label: t.junta.cancelled, color: "#dc2626", bg: "rgba(239,68,68,.12)" };
  if (!isPast(event.starts_at)) return { label: t.junta.open, ...STATUS_OPEN };
  return { label: t.junta.closed, ...STATUS_CLOSED };
}

function BoloRow({ event, onEdit }: { event: EventListItem; onEdit: (id: string) => void }) {
  const [pending, startTransition] = useTransition();
  const status = boloStatus(event);

  function toggleCancelled() {
    startTransition(() => { setCancelledAction(event.id, !event.cancelled); });
  }

  return (
    <div className="junta-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/bolos/${event.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: 14, fontFamily: "var(--font-heading)", textTransform: "uppercase", lineHeight: 1.15 }}>
            {event.title}
          </div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{formatShortDate(event.starts_at)}</div>
        </Link>
      </div>
      <div className="junta-row-end">
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.participants(event.counts.signup_count ?? 0)}</span>
        <StatusPill {...status} />
        <ActionBtn onClick={() => onEdit(event.id)}>{t.junta.edit}</ActionBtn>
        <ActionBtn onClick={toggleCancelled} disabled={pending}>
          {event.cancelled ? t.junta.reactivateBolo : t.junta.cancelBolo}
        </ActionBtn>
        <DeleteEventBtn eventId={event.id} />
      </div>
    </div>
  );
}

export function BolosTab({
  bolos, resetKey, onEdit,
}: {
  bolos: EventListItem[]; resetKey: string; onEdit: (id: string) => void;
}) {
  const pag = usePagination(bolos, 15, "bolos" + resetKey);
  return (
    <>
      <ListCard empty={bolos.length === 0} emptyText={t.junta.noEvents}>
        {pag.pageItems.map((e) => <BoloRow key={e.id} event={e} onEdit={onEdit} />)}
      </ListCard>
      <Pagination {...pag} onPrev={pag.prev} onNext={pag.next} />
    </>
  );
}
