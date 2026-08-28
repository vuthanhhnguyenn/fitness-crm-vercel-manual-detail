import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

export function formatDate(value: string | undefined | null, fallback: string = '—'): string {
  return formatDateYYYYMMDD(value, fallback);
}

export function formatYen(value: number | undefined | null, fallback: string = '—'): string {
  return value != null ? `¥${value.toLocaleString()}` : fallback;
}

export function formatDateTime(value: string | undefined | null, fallback: string = '—'): string {
  return formatDateYYYYMMDD_HHMM(value, fallback);
}

export function formatNextMonthStart(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}年${next.getMonth() + 1}月1日`;
}

/** The 1st of next month as `YYYY-MM-DD` — the apply date a bulk plan change books. */
export function nextMonthStartISO(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Japanese long date without zero padding — e.g. `2026年4月1日` */
export function formatJapaneseDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** Japanese month/day without the year — e.g. `3月31日` */
export function formatJapaneseMonthDay(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatDatetimeISO(
  value: string | undefined | null,
  fallback: string = '—',
): string {
  return formatDateYYYYMMDD_HHMM(value, fallback);
}

export function formatFileSize(bytes: number | undefined | null, fallback: string = '—'): string {
  if (bytes == null) return fallback;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatDurationMinutes(
  minutes: number | undefined | null,
  fallback: string = '-',
): string {
  if (minutes == null) return fallback;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}分`;
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
}
