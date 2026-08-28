'use client';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { History } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { DataTable } from '@/components/common/data-table';
import { Card } from '@/components/ui/card';

import { getCrmBrandsByIdChangeHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { BrandChangeHistoryItem } from '@/lib/api/types.gen';

const historyTableColumns: ColumnDef<BrandChangeHistoryItem>[] = [
  {
    accessorKey: 'changed_at',
    header: '変更日時',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.original.changed_at}</span>
    ),
  },
  {
    accessorKey: 'changed_by',
    header: '変更者',
    cell: ({ row }) => <span className="text-xs">{row.original.changed_by}</span>,
  },
  {
    accessorKey: 'target_display_name',
    header: '対象',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.original.target_display_name}</span>
    ),
  },
  {
    accessorKey: 'changed_field',
    header: '変更項目',
    cell: ({ row }) => <span className="text-xs font-medium">{row.original.changed_field}</span>,
  },
  {
    accessorKey: 'before_value',
    header: '変更前',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.original.before_value}</span>
    ),
  },
  {
    accessorKey: 'after_value',
    header: '変更後',
    cell: ({ row }) => <span className="text-xs font-medium">{row.original.after_value}</span>,
  },
];

export function HistoryTab({ brandId }: { brandId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmBrandsByIdChangeHistoryOptions({ path: { id: brandId } }),
  });

  return (
    <Card className="gap-0 overflow-hidden rounded-lg border p-0">
      <div className="flex items-center gap-2 border-b px-4 pt-4 pb-3">
        <History className="size-4" />
        <h2 className="text-sm font-semibold">変更履歴</h2>
      </div>

      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data || data.histories.length === 0}
        onRetry={() => refetch()}
        emptyTitle="変更履歴がありません"
      >
        <DataTable
          columns={historyTableColumns}
          data={data?.histories ?? []}
          variant="simple"
          className="rounded-none border-x-0 border-b-0"
        />
      </DataStateBoundary>
    </Card>
  );
}
