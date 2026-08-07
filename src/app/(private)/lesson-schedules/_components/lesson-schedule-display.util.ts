import type { LessonScheduleStatus, LessonType, PaymentStatus } from '@/lib/api/types.gen';

export function getLessonTypeLabel(type: LessonType): string {
  return type === 'studio' ? 'スタジオ' : 'パーソナル';
}

const TIME_SLOT_PATTERN = /^\d{1,2}:\d{2}(:\d{2})?$/;

/** Normalize ISO datetime or HH:mm time slot to HH:mm */
export function toTimeSlot(value: string): string {
  if (TIME_SLOT_PATTERN.test(value)) {
    const [hour, minute] = value.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getLessonTypeBadgeVariant(type: LessonType): 'default' | 'secondary' | 'outline' {
  return type === 'studio' ? 'secondary' : 'outline';
}

export function getScheduleStatusLabel(status: LessonScheduleStatus): string {
  switch (status) {
    case 'scheduled':
      return '予定';
    case 'in_progress':
      return '開催中';
    case 'completed':
      return '終了';
    case 'cancelled':
      return 'キャンセル';
    default:
      return status;
  }
}

export function getScheduleStatusVariant(
  status: LessonScheduleStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'scheduled':
      return 'outline';
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
      return '支払済';
    case 'unpaid':
      return '未払い';
    case 'partial':
      return '一部払済';
    default:
      return status;
  }
}

export function getPaymentStatusVariant(
  status: PaymentStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid':
      return 'secondary';
    case 'unpaid':
      return 'destructive';
    case 'partial':
      return 'outline';
    default:
      return 'outline';
  }
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${toTimeSlot(startTime)}〜${toTimeSlot(endTime)}`;
}

export function formatBookingLabel(booked: number, capacity: number): string {
  return `${booked}/${capacity}`;
}

export function getOccupancyColor(booked: number, capacity: number): string {
  if (capacity === 0) return 'text-muted-foreground';
  const rate = booked / capacity;
  if (rate >= 1) return 'text-destructive';
  if (rate >= 0.8) return 'text-orange-500';
  return 'text-foreground';
}

export function formatOccupancyRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/** Truncate booked member names list for display (my_schedule view) */
export function formatBookedMemberNames(
  members: Array<{ name: string }> | undefined,
  maxDisplay = 2,
): string {
  if (!members || members.length === 0) return '';
  const names = members.slice(0, maxDisplay).map((m) => m.name);
  const remaining = members.length - maxDisplay;
  return remaining > 0 ? `${names.join('、')} 他${remaining}名` : names.join('、');
}
