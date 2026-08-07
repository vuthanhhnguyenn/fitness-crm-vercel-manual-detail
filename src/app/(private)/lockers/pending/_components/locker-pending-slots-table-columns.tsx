import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { GetCrmLockersPendingSlotsResponse } from '@/lib/api/types.gen';

import {
  LOCKER_LOCK_TYPE_LABELS,
  LOCKER_PENDING_LOCATION_LABELS,
} from '../../_constants/constants';
import type { LockerSlotReleaseTarget } from '../../_utils/locker-slot-release.util';

type LockerPendingRow = GetCrmLockersPendingSlotsResponse['pending_slots'][number];

function pendingDaysClass(days: number) {
  if (days >= 30) return 'bg-destructive/15 text-destructive border-destructive/20';
  if (days >= 14) return 'bg-warning/15 text-warning border-warning/20';
  return 'bg-muted text-muted-foreground border-border';
}

type LockerPendingSlotsTableColumnsOptions = {
  canSelect?: boolean;
  areAllCurrentRowsSelected: boolean;
  selectedIds: Set<string>;
  toggleAllCurrentRows: () => void;
  toggleRow: (target: LockerSlotReleaseTarget) => void;
};

export function getLockerPendingSlotsTableColumns({
  canSelect = true,
  areAllCurrentRowsSelected,
  selectedIds,
  toggleAllCurrentRows,
  toggleRow,
}: LockerPendingSlotsTableColumnsOptions): ColumnDef<LockerPendingRow>[] {
  const selectColumn: ColumnDef<LockerPendingRow> = {
    id: 'select',
    header: () => (
      <div className="flex justify-center">
        <Checkbox checked={areAllCurrentRowsSelected} onCheckedChange={toggleAllCurrentRows} />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() =>
            toggleRow({
              id: row.original.id,
              locker_id: row.original.locker_id,
              slot_number: row.original.slot_number,
            })
          }
        />
      </div>
    ),
    enableSorting: false,
    meta: { className: 'w-10 text-center' },
  };

  return [
    ...(canSelect ? [selectColumn] : []),
    {
      accessorKey: 'slot_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="スロット番号" />,
      cell: ({ row }) => <span className="font-medium">{row.original.slot_number}</span>,
    },
    {
      accessorKey: 'locker_location',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ロケーション" />,
      cell: ({ row }) => (
        <span>{LOCKER_PENDING_LOCATION_LABELS[row.original.locker_location]}</span>
      ),
    },
    {
      accessorKey: 'locker_name',
      header: 'ロッカー名',
    },
    {
      accessorKey: 'member_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="会員名" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.member_name}</p>
          <p className="text-muted-foreground text-xs">{row.original.member_id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'cancel_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="解約日" />,
      cell: ({ row }) => formatDateYYYYMMDD(row.original.cancel_date),
    },
    {
      accessorKey: 'pending_days',
      header: ({ column }) => <DataTableColumnHeader column={column} title="開放待ち日数" />,
      cell: ({ row }) => (
        <Badge variant="outline" className={pendingDaysClass(row.original.pending_days)}>
          {row.original.pending_days}日
        </Badge>
      ),
    },
    {
      accessorKey: 'size',
      header: 'スロットサイズ',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.size}</span>,
    },
    {
      accessorKey: 'lock_type',
      header: '施錠方法',
      cell: ({ row }) => (
        <Badge variant="secondary">{LOCKER_LOCK_TYPE_LABELS[row.original.lock_type]}</Badge>
      ),
    },
  ];
}
