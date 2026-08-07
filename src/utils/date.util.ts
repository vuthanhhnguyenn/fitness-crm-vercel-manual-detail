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

/**
 * Helper: Get date parts already formatted
 */
function getDateParts(d: Date) {
  return {
    yyyy: d.getFullYear(),
    mm: pad2(d.getMonth() + 1),
    dd: pad2(d.getDate()),
    hh: pad2(d.getHours()),
    mi: pad2(d.getMinutes()),
    ss: pad2(d.getSeconds()),
  };
}

/**
 * Generic format function - build format string from template
 */
function formatDate(value: DateInput, template: string, fallback: string = '—'): string {
  const d = parseDate(value);
  if (!d) return fallback;

  const parts = getDateParts(d);

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
 * Format: YYYY-MM-DD (local calendar date, not UTC)
 * e.g. "2026-02-15"
 */
export function formatISODateLocal(value: DateInput, fallback: string = ''): string {
  const d = parseDate(value);
  if (!d) return fallback;
  const parts = getDateParts(d);
  return `${parts.yyyy}-${parts.mm}-${parts.dd}`;
}
