'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import {
  formatBookingLabel,
  formatTimeRange,
  getOccupancyColor,
  getScheduleStatusLabel,
  getScheduleStatusVariant,
} from './lesson-schedule-display.util';

function SortHeader({
  column,
  label,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (asc?: boolean) => void };
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-1 size-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-1 size-3.5" />
      ) : (
        <ArrowUpDown className="ml-1 size-3.5" />
      )}
    </Button>
  );
}

function formatDateLabel(isoString: string): string {
  const d = new Date(isoString);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = dayNames[d.getDay()];
  return `${m}/${day}(${dow})`;
}

function isToday(isoString: string): boolean {
  const today = new Date();
  const d = new Date(isoString);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

const EVENT_TYPE_BADGE: Record<string, { cls: string; label: string }> = {
  studio: { cls: 'bg-info/15 text-info', label: 'スタジオ' },
  personal: { cls: 'bg-success/15 text-success', label: 'パーソナル' },
};

export const scheduleListColumns: ColumnDef<LessonScheduleListItem>[] = [
  {
    id: 'date',
    accessorFn: (row) => row.start_time,
    header: ({ column }) => <SortHeader column={column} label="日付" />,
    cell: ({ row }) => {
      const today = isToday(row.original.start_time);
      return (
        <span
          className={`text-xs whitespace-nowrap ${today ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
        >
          {formatDateLabel(row.original.start_time)}
        </span>
      );
    },
  },
  {
    accessorKey: 'start_time',
    header: ({ column }) => <SortHeader column={column} label="時間" />,
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap">
        {formatTimeRange(row.original.start_time, row.original.end_time)}
      </span>
    ),
  },
  {
    accessorKey: 'lesson_name',
    header: ({ column }) => <SortHeader column={column} label="レッスン名" />,
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.lesson_name}</span>,
  },
  {
    accessorKey: 'lesson_type',
    header: ({ column }) => <SortHeader column={column} label="種別" />,
    cell: ({ row }) => {
      const badge = EVENT_TYPE_BADGE[row.original.lesson_type] ?? EVENT_TYPE_BADGE.studio;
      return (
        <Badge variant="secondary" className={`h-auto px-1 py-0 text-[10px] ${badge.cls}`}>
          {badge.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'instructor_name',
    header: ({ column }) => <SortHeader column={column} label="インストラクター" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.original.instructor_name}</span>
    ),
  },
  {
    accessorKey: 'booked_count',
    header: ({ column }) => <SortHeader column={column} label="予約" />,
    cell: ({ row }) => {
      const { booked_count, capacity } = row.original;
      const rate = capacity > 0 ? booked_count / capacity : 0;
      const label =
        capacity === 1
          ? booked_count >= 1
            ? '予約済'
            : '空き'
          : rate >= 1
            ? '満席'
            : rate >= 0.85
              ? `残${capacity - booked_count}席`
              : formatBookingLabel(booked_count, capacity);
      const colorCls = getOccupancyColor(booked_count, capacity);
      return <span className={`text-center text-xs ${colorCls}`}>{label}</span>;
    },
  },
  {
    accessorKey: 'is_alert',
    header: ({ column }) => <SortHeader column={column} label="アラート" />,
    cell: ({ row }) =>
      row.original.is_alert ? (
        <Badge
          variant="secondary"
          className="bg-destructive/15 text-destructive h-auto px-1 py-0 text-[10px]"
        >
          要対応
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label="ステータス" />,
    cell: ({ row }) => (
      <Badge variant={getScheduleStatusVariant(row.original.status)} className="text-[10px]">
        {getScheduleStatusLabel(row.original.status)}
      </Badge>
    ),
  },
];
