'use client';

import { useRouter } from 'next/navigation';

import { formatDate } from '@/utils/format.util';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmTransfersResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

type TransferItem = NonNullable<GetCrmTransfersResponse['transfers']>[0];

type TransferStatus = TransferItem['status'];

const STATUS_LABELS: Record<TransferStatus, string> = {
  pending: '申請中',
  from_store_approved: '店舗承認済',
  approved: '承認済',
  rejected: '却下',
  completed: '移籍完了',
};

function StatusBadge({ status }: Readonly<{ status: TransferStatus }>) {
  if (status === 'completed') {
    return (
      <Badge variant="secondary" className="text-[10px]">
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  const nonCompleted: Exclude<TransferStatus, 'completed'> = status;
  const classes: Record<Exclude<TransferStatus, 'completed'>, string> = {
    pending: 'bg-info/15 text-info border-info/20',
    from_store_approved: 'bg-warning/15 text-warning border-warning/20',
    approved: 'bg-success/15 text-success border-success/20',
    rejected: 'bg-destructive/15 text-destructive border-destructive/20',
  };

  const dotClasses: Record<Exclude<TransferStatus, 'completed'>, string> = {
    pending: 'bg-info',
    from_store_approved: 'bg-warning',
    approved: 'bg-success',
    rejected: 'bg-destructive',
  };

  return (
    <Badge variant="outline" className={cn('text-[10px]', classes[nonCompleted])}>
      <span className={cn('mr-1 inline-block size-1.5 rounded-full', dotClasses[nonCompleted])} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function TransferTableColumns(): ColumnDef<TransferItem>[] {
  const router = useRouter();

  return [
    {
      accessorKey: 'id',
      header: '申請ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>
      ),
    },
    {
      accessorKey: 'member_name',
      header: '会員名',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.member_name}</span>,
    },
    {
      accessorKey: 'from_store_name',
      header: '移籍元店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.from_store_name}</span>,
    },
    {
      accessorKey: 'to_store_name',
      header: '移籍先店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.to_store_name}</span>,
    },
    {
      accessorKey: 'applied_at',
      header: '申請日',
      meta: { className: 'w-[110px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{formatDate(row.original.applied_at)}</span>
      ),
    },
    {
      accessorKey: 'scheduled_date',
      header: '移籍予定日',
      meta: { className: 'w-[110px]' },
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.scheduled_date)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      meta: { className: 'w-[110px]' },
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      meta: { className: 'w-10' },
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="hover:bg-muted flex size-8 items-center justify-center rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">アクションを開く</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(navigate('/members/transfers/[id]', row.original.id))}
            >
              <Eye className="mr-2 size-4" />
              詳細を表示
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
