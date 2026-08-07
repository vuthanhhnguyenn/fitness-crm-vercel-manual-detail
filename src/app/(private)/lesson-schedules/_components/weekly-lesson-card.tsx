'use client';

import { Lock, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import {
  formatBookingLabel,
  formatTimeRange,
  getOccupancyColor,
} from './lesson-schedule-display.util';

const EVENT_TYPE_BADGE: Record<string, { cls: string; label: string }> = {
  studio: { cls: 'bg-info/15 text-info', label: 'スタジオ' },
  personal: { cls: 'bg-success/15 text-success', label: 'パーソナル' },
};

interface WeeklyLessonCardProps {
  item: LessonScheduleListItem;
  onScheduleClick?: (item: LessonScheduleListItem) => void;
  onEditClick?: (item: LessonScheduleListItem) => void;
  canEdit?: boolean;
}

export function WeeklyLessonCard({
  item,
  onScheduleClick,
  onEditClick,
  canEdit = false,
}: WeeklyLessonCardProps) {
  const typeBadge = EVENT_TYPE_BADGE[item.lesson_type] ?? EVENT_TYPE_BADGE.studio;
  const timeLabel = formatTimeRange(item.start_time, item.end_time);

  const resLabel = (() => {
    if (item.capacity === 1) return item.booked_count >= 1 ? '予約済' : '空き';
    const rate = item.booked_count / item.capacity;
    if (rate >= 1) return '満席';
    if (rate >= 0.85) return `残${item.capacity - item.booked_count}席`;
    return formatBookingLabel(item.booked_count, item.capacity);
  })();

  const resColor = getOccupancyColor(item.booked_count, item.capacity);
  const isInternalOnly = false; // no is_public field in API yet

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.(item);
  };

  return (
    <div className="group relative">
      <div
        className={`cursor-pointer rounded-md p-2 transition-shadow hover:shadow-sm ${
          isInternalOnly ? 'bg-muted/50 border border-dashed' : 'bg-card border'
        } ${item.status === 'cancelled' ? 'line-through opacity-50' : ''}`}
        onClick={() => onScheduleClick?.(item)}
      >
        {/* Row 1: Type badge + Lesson name */}
        <div className="mb-1 flex items-center gap-1">
          <Badge
            variant="secondary"
            className={`h-auto shrink-0 px-1 py-0 text-[9px] ${typeBadge.cls}`}
          >
            {typeBadge.label}
          </Badge>
          <span className="text-foreground truncate text-xs font-semibold">{item.lesson_name}</span>
          {isInternalOnly && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="border-muted-foreground/20 bg-muted text-muted-foreground ml-auto h-auto shrink-0 gap-0.5 px-1 py-0 text-[9px]"
                  >
                    <Lock className="size-2.5" />
                    内部
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">非公開枠（CRM内部のみで管理）</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Row 2: Time + Instructor */}
        <div className="text-muted-foreground flex items-center justify-between text-[10px]">
          <span>{timeLabel}</span>
          <span className="ml-1 truncate">{item.instructor_name}</span>
        </div>

        {/* Row 3: Reservation count + payment type + alert badge */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${resColor}`}>{resLabel}</span>
            {item.lesson_type === 'personal' && item.payment_status && (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground h-auto px-1 py-0 text-[9px]"
              >
                {item.payment_status === 'paid'
                  ? '支払済'
                  : item.payment_status === 'unpaid'
                    ? '未払い'
                    : '一部払済'}
              </Badge>
            )}
          </div>
          {item.is_alert && (
            <Badge
              variant="secondary"
              className="bg-destructive/15 text-destructive h-auto px-1 py-0 text-[9px]"
            >
              要対応
            </Badge>
          )}
        </div>
      </div>

      {canEdit && item.status !== 'completed' && item.status !== 'cancelled' && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-2 size-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleEditClick}
          aria-label="スケジュールを変更"
        >
          <Pencil className="size-3" />
        </Button>
      )}
    </div>
  );
}
