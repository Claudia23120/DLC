/**
 * Catalan date/time formatting for the Europe/Madrid timezone.
 *
 * Month and weekday names are hard-coded (not taken from Intl) so output is
 * always Catalan regardless of the runtime's ICU data. Intl is used only for
 * timezone math, which is available everywhere the app runs.
 */

const TZ = "Europe/Madrid";

const MONTHS_FULL = [
  "gener", "febrer", "març", "abril", "maig", "juny",
  "juliol", "agost", "setembre", "octubre", "novembre", "desembre",
];

// Abbreviations as used in the design's cards/calendar.
const MONTHS_SHORT = [
  "gen", "feb", "març", "abr", "maig", "juny",
  "jul", "ag", "set", "oct", "nov", "des",
];

// 0 = Sunday … 6 = Saturday.
const WEEKDAYS_ABBR = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];
export const WEEKDAYS_CAL = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"]; // Mon-first

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  weekday: number; // 0=Sun..6=Sat
}

/** Wall-clock parts of an instant in Europe/Madrid. */
export function madridParts(iso: string): DateParts {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  let hour = Number(p.hour);
  if (hour === 24) hour = 0; // some ICU builds emit "24" for midnight
  const minute = Number(p.minute);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, hour, minute, weekday };
}

/** "12" — day of month, zero-padded. */
export function formatDay(iso: string): string {
  return String(madridParts(iso).day).padStart(2, "0");
}

/** "set" — short month. */
export function formatMonthShort(iso: string): string {
  return MONTHS_SHORT[madridParts(iso).month - 1];
}

/** "21:30" — time of day. */
export function formatTime(iso: string): string {
  const { hour, minute } = madridParts(iso);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "Dv. 12 de setembre" — long date with weekday, correct de/d' elision. */
export function formatLongDate(iso: string): string {
  const { day, month, weekday } = madridParts(iso);
  const monthName = MONTHS_FULL[month - 1];
  const prep = /^[aeiou]/i.test(monthName) ? "d'" : "de ";
  return `${WEEKDAYS_ABBR[weekday]}. ${day} ${prep}${monthName}`;
}

/** "Dv. 12 de setembre · 21:30" */
export function formatWhen(iso: string): string {
  return `${formatLongDate(iso)} · ${formatTime(iso)}`;
}

/** Offset in minutes that Europe/Madrid is ahead of UTC at the given instant. */
function madridOffsetMinutes(date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

/**
 * Convert a Madrid wall-clock date + time (from date/time inputs) into a UTC
 * ISO string suitable for a timestamptz column. Handles DST correctly.
 */
export function madridDateTimeToISO(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, mi] = (timeStr || "00:00").split(":").map(Number);
  if (!Y || !M || !D) return null;

  const naiveUtc = Date.UTC(Y, M - 1, D, h || 0, mi || 0);
  // Two passes to settle DST at boundaries.
  let off = madridOffsetMinutes(new Date(naiveUtc));
  let utc = naiveUtc - off * 60000;
  off = madridOffsetMinutes(new Date(utc));
  utc = naiveUtc - off * 60000;
  return new Date(utc).toISOString();
}

/** "Setembre 2026" — capitalized month + year, for the calendar header. */
export function monthYearLabel(year: number, month1to12: number): string {
  const name = MONTHS_FULL[month1to12 - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** True when the instant is strictly in the past. */
export function isPast(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
