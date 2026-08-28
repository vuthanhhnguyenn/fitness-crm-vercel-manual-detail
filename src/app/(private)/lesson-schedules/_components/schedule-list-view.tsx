'use client';

import { useState } from 'react';

import { SortingState, getSortedRowModel } from '@tanstack/react-table';

import { DataTable } from '@/components/common/data-table';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import { LessonScheduleTableSkeleton } from './lesson-schedule-skeletons';
import { isToday, scheduleListColumns } from './schedule-list-columns';

interface ScheduleListViewProps {
  schedules: LessonScheduleListItem[];
  isLoading?: boolean;
  onScheduleClick?: (item: LessonScheduleListItem) => void;
}

export function ScheduleListView({
  schedules,
  isLoading = false,
  onScheduleClick,
}: Readonly<ScheduleListViewProps>) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'start_time', desc: false }]);

  if (isLoading) return <LessonScheduleTableSkeleton />;

  return (
    <DataTable
      columns={scheduleListColumns}
      data={schedules}
      variant="simple"
      totalRows={schedules.length}
      onRowClick={onScheduleClick}
      getRowClassName={(row) => (isToday(row.start_time) ? 'bg-primary/5' : undefined)}
      tableOptions={{
        state: { sorting },
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
      }}
    />
  );
}
