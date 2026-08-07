import { format, parseISO } from 'date-fns';

export function formatDate(value: string | undefined | null, fallback: string = '—'): string {
  return value ? new Date(value).toLocaleDateString('ja-JP') : fallback;
}

export function formatYen(value: number | undefined | null, fallback: string = '—'): string {
  return value != null ? `¥${value.toLocaleString()}` : fallback;
}

export function formatDateTime(value: string | undefined | null, fallback: string = '—'): string {
  return value ? new Date(value).toLocaleString('ja-JP') : fallback;
}

export function formatNextMonthStart(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}年${next.getMonth() + 1}月1日`;
}

export function formatDatetimeISO(
  value: string | undefined | null,
  fallback: string = '—',
): string {
  return value ? format(parseISO(value), 'yyyy/MM/dd HH:mm') : fallback;
}
