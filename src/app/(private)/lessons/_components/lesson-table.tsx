'use client';

import { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
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
  const { filters, currentPage, setCurrentPage, pageSize, setSort, lessonContentsQuery } =
    filtersHook;

  const query = lessonContentsQuery(kind);

  const { data, isLoading, isError, refetch } = useQuery({
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

      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && rows.length === 0}
        onRetry={() => refetch()}
        emptyTitle="レッスンが見つかりません"
        emptyDescription="検索条件を変更してお試しください"
        skeleton={
          <DataTable
            columns={lessonTableColumns}
            data={[]}
            isLoading
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
          />
        }
      >
        <DataTable
          columns={lessonTableColumns}
          data={rows}
          variant="simple"
          onRowClick={(row) => router.push(navigate('/lessons/[id]', row.id))}
          className="rounded-none border-x-0 border-b-0"
          tableOptions={{
            manualSorting: true,
            onSortingChange: handleSortingChange,
            state: { sorting },
            getRowId: (originalRow) => originalRow.id,
          }}
        />
      </DataStateBoundary>

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
