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

function ReunioRow({ event, onEdit }: { event: EventListItem; onEdit: (id: string) => void }) {
  const status = !isPast(event.starts_at)
    ? { label: t.junta.open, ...STATUS_OPEN }
    : { label: t.junta.closed, ...STATUS_CLOSED };

  return (
    <div className="junta-row">
      <Link href={`/reunions/${event.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
        <div style={rowTitleStyle}>{event.title}</div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{formatShortDate(event.starts_at)}</div>
      </Link>
      <div className="junta-row-end">
        <StatusPill {...status} />
        <ActionBtn onClick={() => onEdit(event.id)}>{t.junta.edit}</ActionBtn>
        <DeleteEventBtn eventId={event.id} />
      </div>
    </div>
  );
}

export function ReunionsTab({
  reunions, resetKey, onEdit,
}: {
  reunions: EventListItem[]; resetKey: string; onEdit: (id: string) => void;
}) {
  const pag = usePagination(reunions, 15, "reunions" + resetKey);
  return (
    <>
      <ListCard empty={reunions.length === 0} emptyText={t.junta.noEvents}>
        {pag.pageItems.map((e) => <ReunioRow key={e.id} event={e} onEdit={onEdit} />)}
      </ListCard>
      <Pagination {...pag} onPrev={pag.prev} onNext={pag.next} />
    </>
  );
}
