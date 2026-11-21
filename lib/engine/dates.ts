/** Pure ISO-date helpers (UTC, no time zones). Dates are "YYYY-MM-DD". */

const DAY = 86_400_000;

export function toUtc(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * DAY);
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7);
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUtc(target.getTime());
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

/** Whole days from a to b (b − a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY);
}

export function minDate(a: string, b: string) {
  return a <= b ? a : b;
}

export function maxDate(a: string, b: string) {
  return a >= b ? a : b;
}

/** Last day of the year in which the date occurs. */
export function endOfYear(iso: string): string {
  return `${iso.slice(0, 4)}-12-31`;
}
