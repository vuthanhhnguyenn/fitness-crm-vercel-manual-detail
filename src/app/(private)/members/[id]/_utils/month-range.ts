/** Shared helpers for the member-detail month-based history cards (`YYYY/MM` strings). */
import { formatDateYYYYMM, formatISODateLocal } from '@/utils/date.util';
import { addMonths, endOfMonth } from 'date-fns';

/**
 * The format `MonthPicker` reads and emits (`YYYY/MM`).
 * Use it in the Zod schema of any field backed by a MonthPicker, then convert with
 * `toApiYearMonth` on submit — the API contract is `YYYY-MM`.
 */
export const PICKER_YEAR_MONTH_PATTERN = /^\d{4}\/\d{2}$/;

/** Current month as `YYYY/MM` (local time). */
export function currentYearMonth(): string {
  return formatDateYYYYMM(new Date());
}

/** `"2026-07"` / `"2026/07"` → `"2026/07"` */
export function normalizeYearMonth(ym: string): string {
  return ym.replace('-', '/');
}

/**
 * `"2026/07"` (MonthPicker value) → `"2026-07"`.
 * The API month contract is `YYYY-MM`; MonthPicker emits `YYYY/MM`, so normalize before sending.
 */
export function toApiYearMonth(ym: string): string {
  return ym.replace('/', '-');
}

/** Parse a `YYYY/MM` month into its first day (local time). */
function yearMonthToDate(ym: string): Date {
  const [year, month] = ym.split('/').map(Number);
  return new Date(year!, month! - 1, 1);
}

/** Shift a `YYYY/MM` month by `delta` months. */
export function shiftYearMonth(ym: string, delta: number): string {
  return formatDateYYYYMM(addMonths(yearMonthToDate(ym), delta));
}

/** Difference in months between two `YYYY/MM` months (`a - b`). */
export function diffYearMonths(a: string, b: string): number {
  const [ay, am] = a.split('/').map(Number);
  const [by, bm] = b.split('/').map(Number);
  return (ay! - by!) * 12 + (am! - bm!);
}

/** Convert a `YYYY/MM` month into an inclusive `from`/`to` date range (`YYYY-MM-DD`). */
export function monthToRange(month: string): { from: string; to: string } {
  const firstDay = yearMonthToDate(month);
  return {
    from: formatISODateLocal(firstDay),
    to: formatISODateLocal(endOfMonth(firstDay)),
  };
}
