import { monthYearLabel } from "@/lib/utils/dates";
import { t } from "@/i18n/t";

/** The fields of a commission that define when it runs (dates are "YYYY-MM-DD"). */
export interface CommissionPeriod {
  starts_on: string | null;
  ends_on: string | null;
}

function yearMonth(date: string): [number, number] {
  const [y, m] = date.split("-").map(Number);
  return [y, m];
}

/** Inclusive number of months the commission spans, or null when it's all year. */
export function commissionMonths({ starts_on, ends_on }: CommissionPeriod): number | null {
  if (!starts_on || !ends_on) return null;
  const [sy, sm] = yearMonth(starts_on);
  const [ey, em] = yearMonth(ends_on);
  return (ey - sy) * 12 + (em - sm) + 1;
}

/** "Novembre 2025 – Febrer 2026", or "Tot l'any". */
export function commissionPeriodLabel(c: CommissionPeriod): string {
  if (!c.starts_on || !c.ends_on) return t.commissions.allYear;
  const start = monthYearLabel(...yearMonth(c.starts_on));
  const end = monthYearLabel(...yearMonth(c.ends_on));
  return start === end ? start : `${start} – ${end}`;
}

/** "4 mesos", or null when it's all year. */
export function commissionDurationLabel(c: CommissionPeriod): string | null {
  const n = commissionMonths(c);
  return n === null ? null : t.commissions.months(n);
}

/** `<input type="month">` value ("2026-01") → first day of that month ("2026-01-01"). */
export function monthInputToDate(value: string): string | null {
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : null;
}

/** "2026-01-01" → "2026-01", for an `<input type="month">`. */
export function dateToMonthInput(date: string | null): string {
  return date ? date.slice(0, 7) : "";
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Accent-insensitive search over a commission's name, texts and member names. */
export function matchesCommissionSearch(
  c: {
    name: string;
    description: string | null;
    requirements: string | null;
    members: { full_name: string; nickname: string | null }[];
  },
  query: string,
): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  const haystack = [c.name, c.description, c.requirements, ...c.members.flatMap((m) => [m.full_name, m.nickname])]
    .filter(Boolean)
    .join(" ");
  return normalize(haystack).includes(q);
}

/** Members that aren't in any of the given commissions, keeping their order. */
export function membersWithoutCommission<M extends { id: string }>(
  members: M[],
  commissions: { members: { id: string }[] }[],
): M[] {
  const inSome = new Set(commissions.flatMap((c) => c.members.map((m) => m.id)));
  return members.filter((m) => !inSome.has(m.id));
}
