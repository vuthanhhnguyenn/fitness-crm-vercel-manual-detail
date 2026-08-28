'use client';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnCheckbox } from '@/components/common/data-table/data-table-column-checkbox';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { TrainingEquipmentListItem } from '@/lib/api/types.gen';

import { LOCATION_IN_GYM_LABELS } from '../_constants/training-equipment.constants';
import {
  getInstallationStatusBadgeClass,
  getInstallationStatusDotClass,
  getInstallationStatusLabel,
} from '../_utils/training-equipment-display.util';

type TrainingEquipmentTableColumnsOptions = {
  /** Permission for the FR-009 bulk status change. Without it the checkboxes are disabled. */
  canSelectRows: boolean;
};

/**
 * FR-001 display columns. Each `id` matches the API's `sort` parameter value.
 * Quantity and linked-exercise count are not sortable.
 */
export function getTrainingEquipmentTableColumns({
  canSelectRows,
}: TrainingEquipmentTableColumnsOptions): ColumnDef<TrainingEquipmentListItem>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="w-10 px-2">
          <Checkbox
            aria-label="全て選択"
            disabled={!canSelectRows}
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        </div>
      ),
      cell: ({ row }) => <DataTableColumnCheckbox row={row} className="w-10" />,
      enableSorting: false,
      enableHiding: false,
      meta: { className: 'w-10' },
    },
    {
      id: 'id',
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="機材ID" />,
      enableSorting: true,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="機材名" />,
      enableSorting: true,
      // The shared table cell is `whitespace-nowrap`, which would let a long unbroken name stretch
      // the column and push the following ones out of view — this column wraps within a bound width.
      meta: { className: 'max-w-70 whitespace-normal' },
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium break-all">{row.original.name}</p>
          {row.original.model && (
            <p className="text-muted-foreground truncate text-xs">{row.original.model}</p>
          )}
        </div>
      ),
    },
    {
      id: 'toolType',
      accessorKey: 'toolName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="器具種別" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {row.original.toolName}
        </Badge>
      ),
    },
    {
      id: 'quantity',
      accessorKey: 'quantity',
      header: '数量',
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm">{row.original.quantity}</span>,
    },
    {
      id: 'locationInGym',
      accessorKey: 'locationInGym',
      header: ({ column }) => <DataTableColumnHeader column={column} title="設置場所" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.locationInGym ? LOCATION_IN_GYM_LABELS[row.original.locationInGym] : '—'}
        </span>
      ),
    },
    {
      id: 'installationStatus',
      accessorKey: 'installationStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="設置状態" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`gap-1 text-xs font-medium ${getInstallationStatusBadgeClass(row.original.installationStatus)}`}
        >
          <span
            className={`size-1.5 rounded-full ${getInstallationStatusDotClass(row.original.installationStatus)}`}
          />
          {getInstallationStatusLabel(row.original.installationStatus)}
        </Badge>
      ),
    },
    {
      id: 'linkedExerciseCount',
      accessorKey: 'linkedExerciseCount',
      header: 'エクササイズ紐づけ件数',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.linkedExerciseCount > 0 ? (
          <Badge variant="secondary" className="text-xs font-normal">
            {row.original.linkedExerciseCount}件
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">未設定</span>
        ),
    },
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終更新日" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">{formatDateYYYYMMDD(row.original.updatedAt, '—')}</span>
      ),
    },
  ];
}
