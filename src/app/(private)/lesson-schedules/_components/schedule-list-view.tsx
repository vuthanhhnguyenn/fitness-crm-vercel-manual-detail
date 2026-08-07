'use client';

import { useState } from 'react';

import { SortingState } from '@tanstack/react-table';

import { DataTable } from '@/components/common/data-table';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import { LessonScheduleTableSkeleton } from './lesson-schedule-skeletons';
import { scheduleListColumns } from './schedule-list-columns';

interface ScheduleListViewProps {
  schedules: LessonScheduleListItem[];
  isLoading?: boolean;
  onScheduleClick?: (item: LessonScheduleListItem) => void;
}

export function ScheduleListView({
  schedules,
  isLoading = false,
  onScheduleClick,
}: ScheduleListViewProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'start_time', desc: false }]);

  if (isLoading) return <LessonScheduleTableSkeleton />;

  return (
    <DataTable
      columns={scheduleListColumns}
      data={schedules}
      variant="simple"
      totalRows={schedules.length}
      onRowClick={onScheduleClick}
      tableOptions={{
        state: { sorting },
        onSortingChange: setSorting,
        getSortedRowModel: undefined, // manual sort is handled server-side; client sort fallback
      }}
    />
  );
}
