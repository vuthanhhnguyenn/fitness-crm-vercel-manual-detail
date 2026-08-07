import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnCheckbox } from '@/components/common/data-table/data-table-column-checkbox';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { GetCrmEquipmentResponse } from '@/lib/api/types.gen';

import {
  EQUIPMENT_STATUS_BADGE_MAP,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from '../_constants/constants';

type EquipmentListItem = GetCrmEquipmentResponse['items'][number];

function renderQrCodeId(value: string | null) {
  return value && value.length > 0 ? value : '---';
}

export function getEquipmentTableColumns(): ColumnDef<EquipmentListItem>[] {
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
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="接続機器ID" />,
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="接続機器名" />,
      cell: ({ row }) => <span className="text-sm">{row.original.name}</span>,
    },
    {
      accessorKey: 'controller_number',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="接点制御先番号" className="justify-center" />
      ),
      cell: ({ row }) => (
        <span className="block text-center text-sm">{row.original.controller_number}</span>
      ),
      meta: { className: 'text-center' },
    },
    {
      accessorKey: 'qr_code_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="QRコードID" className="justify-center" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground block text-center text-sm">
          {renderQrCodeId(row.original.qr_code_id)}
        </span>
      ),
      meta: { className: 'text-center' },
    },
    {
      accessorKey: 'equipment_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="機器タイプ" />,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {EQUIPMENT_TYPE_LABELS[row.original.equipment_type]}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      cell: ({ row }) => {
        const statusBadge = EQUIPMENT_STATUS_BADGE_MAP[row.original.status];

        return (
          <Badge variant="outline" className={statusBadge.badgeClassName}>
            <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
            {EQUIPMENT_STATUS_LABELS[row.original.status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="更新日時" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDateYYYYMMDD_HHMM(row.original.updated_at)}
        </span>
      ),
    },
  ];
}
