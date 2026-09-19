import { t } from "@/i18n/t";
import type { EventKind, BoloResponse } from "@/types/database";

/** Visual metadata per event kind (colors mirror the prototype's KINDS). */
export const KIND_META: Record<
  EventKind,
  { label: string; bg: string; color: string; dot: string }
> = {
  bolo: { label: t.kinds.bolo, bg: "var(--color-accent-100)", color: "var(--color-accent-800)", dot: "var(--color-accent-500)" },
  event: { label: t.kinds.reunio, bg: "var(--color-sage-200)", color: "var(--color-sage-800)", dot: "var(--color-sage-500)" },
  votacio: { label: t.kinds.votacio, bg: "var(--color-sand-200)", color: "var(--color-sand-800)", dot: "var(--color-sand-800)" },
};

/** Visual metadata per bolo attendance response (mirrors ROLES/DOTS). */
export const RESPONSE_META: Record<
  BoloResponse,
  { label: string; bg: string; color: string; dot: string; tone: "red" | "sage" | "ink" | "mute" }
> = {
  diable:    { label: t.responses.diable,    bg: "var(--color-accent-100)", color: "var(--color-accent-800)", dot: "var(--color-accent-500)", tone: "red" },
  tabaler:   { label: t.responses.tabaler,   bg: "var(--color-sand-200)",   color: "var(--color-sand-800)",   dot: "var(--color-sand-800)",   tone: "ink" },
  supporter: { label: t.responses.supporter, bg: "var(--color-sage-200)",   color: "var(--color-sage-800)",   dot: "var(--color-sage-500)",   tone: "sage" },
  si:        { label: t.responses.si,        bg: "var(--color-sage-200)",   color: "var(--color-sage-800)",   dot: "var(--color-sage-500)",   tone: "sage" },
  no:        { label: t.responses.no,        bg: "var(--color-muted-bg)",   color: "var(--color-muted-text)", dot: "rgba(32,30,29,.25)",      tone: "mute" },
};

/** Detail route for an event, by kind. */
export function eventDetailHref(id: string, kind: EventKind): string {
  switch (kind) {
    case "bolo":
      return `/bolos/${id}`;
    case "event":
      return `/reunions/${id}`;
    case "votacio":
      return `/reunions/votacions/${id}`;
  }
}

/** Count label under a card, depending on kind. */
export function countLabel(kind: EventKind, counts: EventCounts): string {
  switch (kind) {
    case "bolo":
      return t.bolos.signedCount(counts.signup_count);
    case "event":
      return t.bolos.confirmedCount(counts.confirmed_count);
    case "votacio":
      return t.bolos.votesCount(counts.vote_count);
  }
}

export interface EventCounts {
  event_id: string;
  signup_count: number;
  confirmed_count: number;
  vote_count: number;
}
