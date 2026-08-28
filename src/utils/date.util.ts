/**
 * Utility type for date input
 */
type DateInput = string | number | Date | null | undefined;

/**
 * Convert input to Date object, return null if invalid
 */
export function parseDate(value: DateInput): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Pad number to 2 digits
 */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Format elapsed time from past to present (Japanese)
 * e.g. "3分前", "2時間前", "5日前"
 */
export function formatElapsedTime(value: DateInput): string {
  const d = parseDate(value);
  if (!d) return '';

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}秒前`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}日前`;
}

/** Matches an ISO 8601 datetime with an explicit UTC offset or "Z" suffix. */
const OFFSET_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** The app's canonical display timezone (JST, UTC+9). */
const DISPLAY_TZ_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Wall-clock components of an offset-bearing ISO string, converted to the
 * app's canonical JST display timezone via the actual instant (not the
 * literal digits) — so "Z" and "+09:00" inputs that represent the same
 * instant always render identically. Reading via a fixed offset + UTC
 * getters (instead of `Date#getHours()` etc., which re-interprets the
 * instant into the *viewer's* local timezone) also keeps display consistent
 * regardless of the browser/server timezone the app happens to run in — see
 * BUG-C01-02, where a JST timestamp near midnight rendered as the previous
 * day for a non-JST viewer.
 */
function literalDateParts(raw: string) {
  if (!OFFSET_DATETIME_RE.test(raw)) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const jst = new Date(d.getTime() + DISPLAY_TZ_OFFSET_MS);
  return {
    yyyy: jst.getUTCFullYear(),
    mm: pad2(jst.getUTCMonth() + 1),
    dd: pad2(jst.getUTCDate()),
    hh: pad2(jst.getUTCHours()),
    mi: pad2(jst.getUTCMinutes()),
    ss: pad2(jst.getUTCSeconds()),
    weekday: jst.getUTCDay(),
  };
}

/**
 * Helper: Get date parts already formatted
 */
function getDateParts(d: Date, raw?: DateInput) {
  if (typeof raw === 'string') {
    const literal = literalDateParts(raw);
    if (literal) return literal;
  }
  return {
    yyyy: d.getFullYear(),
    mm: pad2(d.getMonth() + 1),
    dd: pad2(d.getDate()),
    hh: pad2(d.getHours()),
    mi: pad2(d.getMinutes()),
    ss: pad2(d.getSeconds()),
    weekday: d.getDay(),
  };
}

/**
 * Generic format function - build format string from template
 */
function formatDate(value: DateInput, template: string, fallback: string = '—'): string {
  const d = parseDate(value);
  if (!d) return fallback;

  const parts = getDateParts(d, value);

  return template
    .replace(/{yyyy}/g, parts.yyyy.toString())
    .replace(/{mm}/g, parts.mm)
    .replace(/{dd}/g, parts.dd)
    .replace(/{hh}/g, parts.hh)
    .replace(/{mi}/g, parts.mi)
    .replace(/{ss}/g, parts.ss);
}

/**
 * Format: YYYY/MM HH:mm:ss
 * e.g. "2026/02 12:00:00"
 */
export function formatDateYYYYMM_HHMMSS(value: DateInput, fallback?: string): string {
  return formatDate(value, '{yyyy}/{mm} {hh}:{mi}:{ss}', fallback);
}

/**
 * Format: YYYY/MM/DD HH:mm
 * e.g. "2026/02/15 12:00"
 */
export function formatDateYYYYMMDD_HHMM(value: DateInput, fallback?: string): string {
  return formatDate(value, '{yyyy}/{mm}/{dd} {hh}:{mi}', fallback);
}

/**
 * Format: YYYY/MM
 * e.g. "2026/02"
 */
export function formatDateYYYYMM(value: DateInput, fallback?: string): string {
  return formatDate(value, '{yyyy}/{mm}', fallback);
}

/**
 * Format: YYYY/MM/DD
 * e.g. "2026/02/15"
 */
export function formatDateYYYYMMDD(value: DateInput, fallback?: string): string {
  return formatDate(value, '{yyyy}/{mm}/{dd}', fallback);
}

/**
 * Format: YYYY/MM/DD HH:mm:ss
 * e.g. "2026/02/15 12:00:00"
 */
export function formatDateYYYYMMDD_HHMMSS(value: DateInput, fallback?: string): string {
  return formatDate(value, '{yyyy}/{mm}/{dd} {hh}:{mi}:{ss}', fallback);
}

/**
 * Format: YYYY-MM-DD (local calendar date, not UTC)
 * e.g. "2026-02-15"
 */
export function formatISODateLocal(value: DateInput, fallback: string = ''): string {
  const d = parseDate(value);
  if (!d) return fallback;
  const parts = getDateParts(d, value);
  return `${parts.yyyy}-${parts.mm}-${parts.dd}`;
}

/**
 * Format: HH:mm
 * e.g. "12:00"
 */
export function formatTime(value: DateInput, fallback: string = '—'): string {
  return formatDate(value, '{hh}:{mi}', fallback);
}

/**
 * Japanese short weekday names, indexed by Date.getDay() (0 = Sunday)
 */
const JP_WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * Format: M/D（曜） (no leading zeros, Japanese weekday)
 * e.g. "2/15（土）"
 */
export function formatDateMDWeekday(value: DateInput, fallback: string = '—'): string {
  const d = parseDate(value);
  if (!d) return fallback;
  const parts = getDateParts(d, value);
  return `${Number(parts.mm)}/${Number(parts.dd)}（${JP_WEEKDAYS[parts.weekday]}）`;
}

/**
 * Format: M/D（曜）HH:mm (no leading zeros on date, Japanese weekday)
 * e.g. "2/15（土）12:00"
 */
export function formatDateMDWeekdayTime(value: DateInput, fallback: string = '—'): string {
  const d = parseDate(value);
  if (!d) return fallback;
  const parts = getDateParts(d, value);
  return `${Number(parts.mm)}/${Number(parts.dd)}（${JP_WEEKDAYS[parts.weekday]}）${parts.hh}:${parts.mi}`;
}
