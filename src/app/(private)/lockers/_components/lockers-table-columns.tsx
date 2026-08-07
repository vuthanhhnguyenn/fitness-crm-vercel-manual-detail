import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { GetCrmLockersResponse } from '@/lib/api/types.gen';

import { LOCKER_OPTION_TYPE_LABELS, LOCKER_SHAPE_LABELS } from '../_constants/constants';

type LockerRow = GetCrmLockersResponse['lockers'][number];

export function getLockersTableColumns(): ColumnDef<LockerRow>[] {
  return [
    {
      accessorKey: 'locker_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ロッカーID" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.locker_id}</span>
      ),
    },
    {
      accessorKey: 'area',
      header: ({ column }) => <DataTableColumnHeader column={column} title="エリア" />,
      cell: ({ row }) => <span>{row.original.area}</span>,
    },
    {
      accessorKey: 'shape',
      header: ({ column }) => <DataTableColumnHeader column={column} title="形状" />,
      cell: ({ row }) => (
        <Badge variant="secondary">{LOCKER_SHAPE_LABELS[row.original.shape]}</Badge>
      ),
    },
    {
      accessorKey: 'option_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="オプション契約" />,
      cell: ({ row }) => <span>{LOCKER_OPTION_TYPE_LABELS[row.original.option_type]}</span>,
    },
    {
      accessorKey: 'slots',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="スロット数" className="justify-center" />
      ),
      cell: ({ row }) => (
        <span className="block text-center font-medium">{row.original.slots}</span>
      ),
      meta: { className: 'text-center' },
    },
    {
      accessorKey: 'available_slots',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="空き/使用中" className="justify-center" />
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-success font-medium">{row.original.available_slots}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-info font-medium">{row.original.in_use_slots}</span>
        </div>
      ),
      meta: { className: 'text-center' },
    },
    {
      accessorKey: 'numbering_pattern',
      header: 'ナンバリング',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.numbering_pattern}</span>
      ),
    },
  ];
}
