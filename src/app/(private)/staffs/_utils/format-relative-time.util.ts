import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * Formats an ISO datetime as a relative time string (e.g. "3日前").
 * Callers are responsible for handling `null` (e.g. rendering "未ログイン") —
 * this util only formats a known, non-null datetime.
 */
export function formatRelativeTime(isoDateTime: string): string {
  return formatDistanceToNow(new Date(isoDateTime), { addSuffix: true, locale: ja });
}
