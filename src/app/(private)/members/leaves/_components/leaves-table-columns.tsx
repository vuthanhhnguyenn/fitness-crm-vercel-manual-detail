'use client';

import { useRouter } from 'next/navigation';

import type { ColumnDef } from '@tanstack/react-table';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import type { Brand, GetCrmLeavesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  LEAVE_STATUS_CLASSES,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_CLASSES,
  LEAVE_TYPE_LABELS,
} from '../_constants/constants';

type LeaveRow = NonNullable<GetCrmLeavesResponse['leaves']>[number];

export function LeavesTableColumns(): ColumnDef<LeaveRow>[] {
  const router = useRouter();

  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="申請ID" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>
      ),
      meta: { label: '申請ID' },
    },
    {
      accessorKey: 'member_id',
      header: '会員ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.member_id}</span>
      ),
    },
    {
      accessorKey: 'member_name',
      header: '会員名',
      cell: ({ row }) => (
        <span
          className="cursor-pointer text-sm font-medium hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            router.push(navigate('/members/[id]', row.original.member_id));
          }}
        >
          {row.original.member_name}
        </span>
      ),
      meta: { label: '会員名' },
    },
    {
      accessorKey: 'brand',
      header: 'ブランド',
      cell: ({ row }) => {
        return <BrandBadge brand={row.original.brand as Brand} />;
      },
    },
    {
      accessorKey: 'store_name',
      header: '店舗名',
      cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
    },
    {
      accessorKey: 'type',
      header: '種別',
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge variant="outline" className={`text-[10px] ${LEAVE_TYPE_CLASSES[type]}`}>
            {LEAVE_TYPE_LABELS[type]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => {
        const status = row.original.status;
        const cfg = LEAVE_STATUS_CLASSES[status];
        if (!cfg.isOutline) {
          return (
            <Badge variant="secondary" className="text-[10px]">
              {LEAVE_STATUS_LABELS[status]}
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className={`text-[10px] ${cfg.badge}`}>
            <span className={`mr-1 inline-block size-1.5 rounded-full ${cfg.dot}`} />
            {LEAVE_STATUS_LABELS[status]}
          </Badge>
        );
      },
      meta: { label: 'ステータス' },
    },
    {
      accessorKey: 'applied_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="申請日" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.applied_at}</span>
      ),
      meta: { label: '申請日' },
    },
    {
      accessorKey: 'scheduled_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="予定日" />,
      cell: ({ row }) => <span className="text-xs">{row.original.scheduled_date}</span>,
      meta: { label: '予定日' },
    },
    {
      accessorKey: 'end_date',
      header: '終了日',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.end_date ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'unpaid_amount',
      header: '未納金',
      cell: ({ row }) => {
        const amount = row.original.unpaid_amount;
        return (
          <span
            className={`block text-right text-xs ${amount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
          >
            {amount > 0 ? `¥${amount.toLocaleString()}` : '¥0'}
          </span>
        );
      },
    },
  ];
}
