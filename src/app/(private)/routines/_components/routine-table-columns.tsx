'use client';

import type { ReactNode } from 'react';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { RoutineListItem } from '@/lib/api/types.gen';

import {
  ROUTINE_PUBLISH_STATUS_LABELS,
  getRoutinePublishStatusBadgeClass,
  getRoutinePublishStatusDotClass,
} from '../_constants/routine.constants';

export function getRoutineTableColumns(
  renderActions: (routine: RoutineListItem) => ReactNode,
): ColumnDef<RoutineListItem>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ルーティン名" />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.name}</p>
          <p className="text-muted-foreground text-xs">{row.original.routineCode}</p>
        </div>
      ),
    },
    {
      id: 'categoryName',
      accessorKey: 'categoryName',
      header: 'ルーティンカテゴリ',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {row.original.categoryName}
        </Badge>
      ),
    },
    {
      id: 'exerciseCount',
      accessorKey: 'exerciseCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="エクササイズ数" />,
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm">{row.original.exerciseCount}種目</span>,
    },
    {
      id: 'publishStatus',
      accessorKey: 'publishStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`gap-1 text-xs font-medium ${getRoutinePublishStatusBadgeClass(row.original.publishStatus)}`}
        >
          <span
            className={`size-1.5 rounded-full ${getRoutinePublishStatusDotClass(row.original.publishStatus)}`}
          />
          {ROUTINE_PUBLISH_STATUS_LABELS[row.original.publishStatus]}
        </Badge>
      ),
    },
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終更新日" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDateYYYYMMDD(row.original.updatedAt, '—')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      meta: { className: 'w-10' },
      cell: ({ row }) => renderActions(row.original),
    },
  ];
}
