'use client';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnCheckbox } from '@/components/common/data-table/data-table-column-checkbox';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

import { TRAINING_EQUIPMENT_LOCATION_IN_GYM_LABELS } from '../_constants/training-equipment.constants';
import {
  getTrainingEquipmentStatusBadgeClass,
  getTrainingEquipmentStatusDotClass,
  getTrainingEquipmentStatusLabel,
} from '../_utils/training-equipment-display.util';

export function getTrainingEquipmentTableColumns(): ColumnDef<TrainingEquipmentItem>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="w-10 px-2">
          <Checkbox
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
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
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium break-all">{row.original.name}</p>
          {row.original.model_number && (
            <p className="text-muted-foreground truncate text-xs">{row.original.model_number}</p>
          )}
        </div>
      ),
    },
    {
      id: 'tool_type',
      accessorKey: 'tool_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="器具種別" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {row.original.tool_name ?? row.original.tool_type}
        </Badge>
      ),
    },
    {
      id: 'quantity',
      accessorKey: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="数量" />,
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm">{row.original.quantity}</span>,
    },
    {
      id: 'installation_area',
      accessorKey: 'installation_area',
      header: ({ column }) => <DataTableColumnHeader column={column} title="設置場所" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.installation_area
            ? TRAINING_EQUIPMENT_LOCATION_IN_GYM_LABELS[row.original.installation_area]
            : '—'}
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="設置状態" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`gap-1 text-xs font-medium ${getTrainingEquipmentStatusBadgeClass(row.original.status)}`}
        >
          <span
            className={`size-1.5 rounded-full ${getTrainingEquipmentStatusDotClass(row.original.status)}`}
          />
          {getTrainingEquipmentStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: 'linked_exercise_count',
      accessorKey: 'linked_exercise_count',
      header: '紐づけ件数',
      cell: ({ row }) =>
        row.original.linked_exercise_count > 0 ? (
          <Badge variant="secondary" className="text-xs font-normal">
            {row.original.linked_exercise_count}件
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">未設定</span>
        ),
    },
    {
      id: 'last_updated_at',
      accessorKey: 'last_updated_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="最終更新日" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">{formatDateYYYYMMDD(row.original.last_updated_at, '—')}</span>
      ),
    },
  ];
}
