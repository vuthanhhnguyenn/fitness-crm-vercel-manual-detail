'use client';

import { CircleAlert, MapPin, Pencil, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import { formatBookedMemberNames, formatBookingLabel } from './lesson-schedule-display.util';

const LESSON_TYPE_STYLES: Record<string, { border: string; label: string; badgeCls: string }> = {
  studio: { border: 'border-l-info', label: 'スタジオ', badgeCls: 'bg-info/15 text-info' },
  personal: {
    border: 'border-l-success',
    label: 'パーソナル',
    badgeCls: 'bg-success/15 text-success',
  },
};

interface TimelineItemProps {
  item: LessonScheduleListItem;
  isLast?: boolean;
  showBookedMembers?: boolean;
  onScheduleClick?: (item: LessonScheduleListItem) => void;
  onEditClick?: (item: LessonScheduleListItem) => void;
  canEdit?: boolean;
}

export function TimelineItem({
  item,
  isLast = false,
  showBookedMembers = false,
  onScheduleClick,
  onEditClick,
  canEdit = false,
}: TimelineItemProps) {
  const typeStyle = LESSON_TYPE_STYLES[item.lesson_type] ?? LESSON_TYPE_STYLES.studio;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.(item);
  };

  const startLabel = new Date(item.start_time).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const endLabel = new Date(item.end_time).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const bookingLabel = (() => {
    if (item.capacity === 1) {
      return item.booked_count >= 1 ? '予約済' : '空き';
    }
    const rate = item.booked_count / item.capacity;
    const remaining = item.capacity - item.booked_count;
    if (rate >= 1) return '満席';
    if (rate >= 0.85) return `残${remaining}席`;
    return formatBookingLabel(item.booked_count, item.capacity) + '名';
  })();

  return (
    <div
      className={`group hover:bg-accent/50 relative -mx-2 flex cursor-pointer gap-4 rounded-lg px-2 transition-colors ${
        item.status === 'completed' ? 'opacity-60' : ''
      }`}
      onClick={() => onScheduleClick?.(item)}
    >
      {/* Time column */}
      <div className="w-16 shrink-0 py-3 text-right">
        <p className={`text-sm font-semibold ${item.is_alert ? 'text-destructive' : ''}`}>
          {startLabel}
        </p>
        <p className="text-muted-foreground text-xs">{endLabel}</p>
      </div>

      {/* Color bar */}
      <div
        className={`border-l-4 ${typeStyle.border} ${item.is_alert ? 'bg-destructive/10' : ''} flex-1 py-3 pr-2 pl-4 ${!isLast ? 'border-b-border border-b' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            {/* Lesson name + type badge + status/alert badge */}
            <div className="flex items-center gap-2">
              <p className={`text-sm font-semibold ${item.is_alert ? 'text-destructive' : ''}`}>
                {item.lesson_name}
              </p>
              <Badge
                variant="secondary"
                className={`h-auto px-1 py-0 text-[10px] ${typeStyle.badgeCls}`}
              >
                {typeStyle.label}
              </Badge>
              {item.is_alert ? (
                <Badge
                  variant="secondary"
                  className="bg-destructive/15 text-destructive h-auto px-1 py-0 text-[10px]"
                >
                  要対応
                </Badge>
              ) : item.status === 'in_progress' ? (
                <Badge
                  variant="secondary"
                  className="bg-success/15 text-success h-auto px-1 py-0 text-[10px]"
                >
                  実施中
                </Badge>
              ) : null}
            </div>

            {/* Detail row */}
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              {/* Store badge for my_schedule view */}
              {showBookedMembers && (
                <Badge variant="outline" className="h-auto px-1 py-0 text-[10px] font-normal">
                  {item.store_name}
                </Badge>
              )}
              {item.studio_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {item.studio_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {item.instructor_name}
              </span>
              <span>{bookingLabel}</span>
              {item.waiting_count > 0 && (
                <span className="text-warning">キャンセル待ち {item.waiting_count}名</span>
              )}
              {/* Payment type badge for personal lessons */}
              {item.lesson_type === 'personal' && item.payment_status && (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground h-auto px-1 py-0 text-[10px]"
                >
                  {item.payment_status === 'paid'
                    ? '支払済'
                    : item.payment_status === 'unpaid'
                      ? '未払い'
                      : '一部払済'}
                </Badge>
              )}
            </div>

            {/* Booked member names (my_schedule view) */}
            {showBookedMembers && item.booked_members && item.booked_members.length > 0 && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span className="text-muted-foreground text-[10px]">予約者:</span>
                <span className="text-foreground text-[11px]">
                  {formatBookedMemberNames(item.booked_members)}
                </span>
              </div>
            )}

            {/* Alert text */}
            {item.is_alert && (
              <div className="mt-1 flex items-center gap-1">
                <CircleAlert className="text-destructive size-3 shrink-0" />
                <span className="text-destructive text-xs font-medium">要確認</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit button */}
      {canEdit && item.status !== 'completed' && item.status !== 'cancelled' && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-3 size-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleEditClick}
          aria-label="スケジュールを変更"
        >
          <Pencil className="size-3" />
        </Button>
      )}
    </div>
  );
}
