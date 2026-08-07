'use client';

import { useMemo } from 'react';

import type { SortingState } from '@tanstack/react-table';
import { SearchX } from 'lucide-react';

import { DataTable } from '@/components/common/data-table';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Button } from '@/components/ui/button';

import {
  MANUAL_NOTIFICATION_PAGE_SIZE_OPTIONS,
  type ManualNotificationRow,
} from '../_constants/manual-notification.constants';
import { getManualNotificationsTableColumns } from './manual-notifications-table-columns';

interface ManualNotificationsTableProps {
  readonly items: ManualNotificationRow[];
  readonly total: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly onRetry: () => void;
  readonly sorting: SortingState;
  readonly onSortingChange: (
    updater: SortingState | ((previous: SortingState) => SortingState),
  ) => void;
  readonly hasActiveFilters: boolean;
  readonly onClearFilters: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly onRowClick: (row: ManualNotificationRow) => void;
}

export function ManualNotificationsTable({
  items,
  total,
  currentPage,
  pageSize,
  isLoading,
  isFetching,
  isError,
  onRetry,
  sorting,
  onSortingChange,
  hasActiveFilters,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: ManualNotificationsTableProps) {
  const columns = useMemo(() => getManualNotificationsTableColumns(), []);
  const emptyContent = isError ? (
    <div className="border-destructive/20 bg-destructive/5 flex min-h-32 flex-col items-center justify-center gap-3 border px-4 py-8 text-center">
      <p className="text-destructive text-sm font-semibold">手動配信通知の取得に失敗しました</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        再試行する
      </Button>
    </div>
  ) : (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <SearchX className="text-muted-foreground/60 size-9 stroke-[1.75]" />
      <p className="text-muted-foreground text-sm">条件に一致する通知がありません</p>
      {hasActiveFilters ? (
        <Button variant="outline" size="sm" className="text-xs" onClick={onClearFilters}>
          条件をクリア
        </Button>
      ) : null}
    </div>
  );

  const table = (
    <DataTable
      columns={columns}
      data={isError ? [] : items}
      isLoading={isLoading}
      isFetching={isFetching}
      variant="simple"
      className="rounded-none border-x-0 border-b-0 text-xs [&_td]:h-14 [&_td]:text-xs [&_td]:leading-4 [&_th]:text-xs [&_th]:leading-4 [&_th]:font-semibold [&_thead_tr]:h-10 [&_thead_tr]:bg-neutral-100"
      containerClassName="overflow-x-auto"
      emptyContent={emptyContent}
      tableOptions={{
        manualSorting: true,
        onSortingChange,
        state: { sorting },
      }}
      onRowClick={onRowClick}
    />
  );

  return (
    <>
      <div className="relative">
        {isFetching && !isLoading ? (
          <div className="bg-primary absolute top-0 right-0 left-0 z-20 h-0.5 animate-pulse" />
        ) : null}
        {table}
      </div>

      {!isLoading && !isError ? (
        <TablePaginationWithSize
          total={total}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={MANUAL_NOTIFICATION_PAGE_SIZE_OPTIONS}
          className="flex-col border-t sm:flex-row"
        />
      ) : null}
    </>
  );
}
