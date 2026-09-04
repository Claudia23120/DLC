/** Calendar event input for both .ics generation and the Google link. */
export interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  /** ISO strings. If `end` is missing, a 2h default is used. */
  start: string;
  end?: string;
}

/** Format a Date as an iCalendar UTC timestamp (YYYYMMDDTHHMMSSZ). */
function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Escape text per RFC 5545. */
function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function resolveEnd(event: CalendarEvent): Date {
  if (event.end) return new Date(event.end);
  const start = new Date(event.start);
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

/** Build a downloadable .ics file body for a single event. */
export function buildIcs(event: CalendarEvent): string {
  const start = new Date(event.start);
  const end = resolveEnd(event);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Colla de Diables de les Corts//app//CA",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid}@diableslescorts.cat`,
    `DTSTAMP:${toIcsUtc(new Date(event.start))}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.location ? `LOCATION:${escapeIcs(event.location)}` : null,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Build an "Add to Google Calendar" URL for the same event. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const start = new Date(event.start);
  const end = resolveEnd(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Safe filename for the downloaded .ics. */
export function icsFilename(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() + ".ics";
}
