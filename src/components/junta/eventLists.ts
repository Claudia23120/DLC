import type { EventListItem } from "@/lib/data/events";

/**
 * Events of one kind, newest first (by `starts_at`, or `closes_at` for polls),
 * filtered by a lower-cased title query.
 */
export function filterSortEvents(
  events: EventListItem[],
  kind: EventListItem["kind"],
  query: string,
): EventListItem[] {
  const dateKey: "starts_at" | "closes_at" = kind === "votacio" ? "closes_at" : "starts_at";
  return events
    .filter((e) => e.kind === kind)
    .sort((a, b) => new Date(b[dateKey] ?? 0).getTime() - new Date(a[dateKey] ?? 0).getTime())
    .filter((e) => !query || e.title.toLowerCase().includes(query));
}
