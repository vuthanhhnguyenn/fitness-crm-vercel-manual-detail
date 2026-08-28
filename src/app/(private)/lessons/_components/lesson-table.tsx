'use client';

import { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';

import { getCrmLessonContentsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import type { UseLessonsFiltersReturn } from '../_hooks/use-lessons-filters';
import { lessonTableColumns } from './lesson-table-columns';
import { LessonsFilterBar } from './lessons-filter-bar';

interface LessonTableProps {
  kind: 'studio' | 'bodycare';
  filtersHook: UseLessonsFiltersReturn;
}

export function LessonTable({ kind, filtersHook }: LessonTableProps) {
  const router = useRouter();
  const {
    filters,
    currentPage,
    setCurrentPage,
    pageSize,
    setSort,
    lessonContentsQuery,
    clearFilters,
  } = filtersHook;

  const query = lessonContentsQuery(kind);

  const { data, isLoading } = useQuery({
    ...getCrmLessonContentsOptions({ query }),
  });

  const rows = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = [{ id: filters.sort_by, desc: filters.sort_order === 'desc' }];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) return;
    setSort(next[0].id, next[0].desc ? 'desc' : 'asc');
  };

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <LessonsFilterBar
        variant="lesson"
        filtersHook={filtersHook}
        searchPlaceholder="レッスン名・IDで検索..."
      />
      <DataTable
        columns={lessonTableColumns}
        data={rows}
        isLoading={isLoading}
        variant="simple"
        onRowClick={(row) => router.push(navigate('/lessons/[id]', row.id))}
        className="rounded-none border-x-0 border-b-0"
        tableOptions={{
          manualSorting: true,
          onSortingChange: handleSortingChange,
          state: { sorting },
          getRowId: (originalRow) => originalRow.id,
        }}
        emptyContent={
          <Empty
            onAction={clearFilters}
            title="レッスンが見つかりません"
            description="検索条件を変更してお試しください"
          />
        }
      />
      {total > 0 && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
