"use client";

import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { formatShortDate, isPast } from "@/lib/utils/dates";
import { t } from "@/i18n/t";
import type { EventListItem } from "@/lib/data/events";
import {
  ActionBtn, DeleteEventBtn, ListCard, StatusPill, STATUS_CLOSED, STATUS_OPEN, rowTitleStyle,
} from "./parts";

function VotacioRow({ event, onEdit }: { event: EventListItem; onEdit: (id: string) => void }) {
  const status = isPast(event.closes_at)
    ? { label: t.junta.pollClosed, ...STATUS_CLOSED }
    : { label: t.junta.pollOpen, ...STATUS_OPEN };

  return (
    <div className="junta-row">
      <Link href={`/reunions/votacions/${event.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
        <div style={rowTitleStyle}>{event.title}</div>
        {event.closes_at
          ? <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{t.polls.closesOn} {formatShortDate(event.closes_at)}</div>
          : null}
      </Link>
      <div className="junta-row-end">
        <span style={{ fontSize: 12, opacity: 0.55 }}>{t.junta.votes(event.counts.vote_count ?? 0)}</span>
        <StatusPill {...status} />
        <ActionBtn onClick={() => onEdit(event.id)}>{t.junta.edit}</ActionBtn>
        <DeleteEventBtn eventId={event.id} />
      </div>
    </div>
  );
}

export function VotacionsTab({
  votacions, resetKey, onEdit,
}: {
  votacions: EventListItem[]; resetKey: string; onEdit: (id: string) => void;
}) {
  const pag = usePagination(votacions, 15, "votacions" + resetKey);
  return (
    <>
      <ListCard empty={votacions.length === 0} emptyText={t.junta.noEvents}>
        {pag.pageItems.map((e) => <VotacioRow key={e.id} event={e} onEdit={onEdit} />)}
      </ListCard>
      <Pagination {...pag} onPrev={pag.prev} onNext={pag.next} />
    </>
  );
}
