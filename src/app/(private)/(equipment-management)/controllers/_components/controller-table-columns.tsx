import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { GetCrmControllersResponse } from '@/lib/api/types.gen';

import {
  CONTROLLER_LIST_COLUMN_HEADERS,
  CONTROLLER_STATUS_BADGE_MAP,
  CONTROLLER_STATUS_LABELS,
} from '../_constants/constants';

type ControllerListItem = GetCrmControllersResponse['items'][number];

function renderNullable(value: string | null) {
  return value && value.length > 0 ? value : '---';
}

export function getControllerTableColumns(): ColumnDef<ControllerListItem>[] {
  return [
    {
      accessorKey: 'controller_id',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={CONTROLLER_LIST_COLUMN_HEADERS.controllerId}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.controller_id}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={CONTROLLER_LIST_COLUMN_HEADERS.name} />
      ),
      cell: ({ row }) => <span className="text-sm">{renderNullable(row.original.name)}</span>,
    },
    {
      accessorKey: 'store_code',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={CONTROLLER_LIST_COLUMN_HEADERS.storeCode} />
      ),
      cell: ({ row }) => <span className="text-sm">{row.original.store_code}</span>,
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={CONTROLLER_LIST_COLUMN_HEADERS.location} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.location}</span>
      ),
    },
    {
      accessorKey: 'ip_address',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={CONTROLLER_LIST_COLUMN_HEADERS.ipAddress} />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs whitespace-nowrap">{row.original.ip_address}</span>
      ),
    },
    {
      accessorKey: 'firmware_version',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={CONTROLLER_LIST_COLUMN_HEADERS.firmwareVersion}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {renderNullable(row.original.firmware_version)}
        </span>
      ),
    },
    {
      accessorKey: 'control_port_count',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={CONTROLLER_LIST_COLUMN_HEADERS.controlPortCount}
          className="justify-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block text-center text-sm tabular-nums">
          {row.original.control_port_count}
        </span>
      ),
      meta: { className: 'text-center' },
    },
    {
      accessorKey: 'device_count',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={CONTROLLER_LIST_COLUMN_HEADERS.deviceCount}
          className="justify-center"
        />
      ),
      cell: ({ row }) => (
        <span className="block text-center text-sm tabular-nums">
          {row.original.device_count}台
        </span>
      ),
      meta: { className: 'text-center' },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={CONTROLLER_LIST_COLUMN_HEADERS.status} />
      ),
      cell: ({ row }) => {
        const statusBadge = CONTROLLER_STATUS_BADGE_MAP[row.original.status];

        return (
          <Badge variant="outline" className={statusBadge.badgeClassName}>
            <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
            {CONTROLLER_STATUS_LABELS[row.original.status]}
          </Badge>
        );
      },
    },
  ];
}
