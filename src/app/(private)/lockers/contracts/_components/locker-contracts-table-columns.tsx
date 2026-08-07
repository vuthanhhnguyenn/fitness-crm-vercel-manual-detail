import { formatDateYYYYMMDD } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { GetCrmLockersContractsResponse } from '@/lib/api/types.gen';

import {
  LOCKER_CONTRACT_STATUS_BADGE_CLASSES,
  LOCKER_CONTRACT_STATUS_LABELS,
  LOCKER_OPTION_TYPE_LABELS,
} from '../../_constants/constants';

type LockerContractRow = GetCrmLockersContractsResponse['contracts'][number];

export function getLockerContractsTableColumns(): ColumnDef<LockerContractRow>[] {
  return [
    {
      accessorKey: 'contract_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="契約ID" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.contract_id}</span>,
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
      accessorKey: 'locker_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ロッカー番号" />,
      cell: ({ row }) => <span>{row.original.locker_number}</span>,
    },
    {
      accessorKey: 'contract_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="オプション契約" />,
      cell: ({ row }) => (
        <Badge variant="secondary">{LOCKER_OPTION_TYPE_LABELS[row.original.contract_type]}</Badge>
      ),
    },
    {
      accessorKey: 'start_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="契約開始日" />,
      cell: ({ row }) => formatDateYYYYMMDD(row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="契約終了日" />,
      cell: ({ row }) => formatDateYYYYMMDD(row.original.end_date),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={LOCKER_CONTRACT_STATUS_BADGE_CLASSES[row.original.status]}
        >
          {LOCKER_CONTRACT_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
  ];
}
