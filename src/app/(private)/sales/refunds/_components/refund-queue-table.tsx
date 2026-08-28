'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnCheckbox } from '@/components/common/data-table/data-table-column-checkbox';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { RefundQueueEntry } from '@/lib/api/types.gen';

export const REFUND_STATUS_LABELS: Record<RefundQueueEntry['status'], string> = {
  pending: '承認待ち',
  completed: '返金済み',
  rejected: '却下',
};

export function getRefundStatusBadgeClasses(status: RefundQueueEntry['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'completed':
      return 'bg-success/15 text-success border-success/20';
    case 'rejected':
      return 'bg-destructive/15 text-destructive border-destructive/20';
    default:
      return '';
  }
}

/** Badge label — mirrors the mock (`pages/sales-refund-list.tsx`), which shows "HQ" for Headquarter. */
export const REQUESTER_ROLE_BADGE_LABELS: Record<RefundQueueEntry['requester_role'], string> = {
  staff: 'Staff',
  manager: 'Manager',
  headquarter: 'HQ',
};

export const REQUESTER_ROLE_FILTER_LABELS: Record<RefundQueueEntry['requester_role'], string> = {
  staff: 'スタッフ',
  manager: 'マネージャー',
  headquarter: '本部',
};

export const PAYMENT_METHOD_LABELS: Record<RefundQueueEntry['payment_method'], string> = {
  sbps: 'SBPS',
  jaccs: 'JACCS',
  cash: '現金',
  other: 'その他',
};

export function formatYen(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`;
}

export function getRefundQueueColumns(): ColumnDef<RefundQueueEntry>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => {
        const selectableRows = table.getRowModel().rows.filter((row) => row.getCanSelect());
        return (
          <Checkbox
            aria-label="Select all"
            checked={selectableRows.length > 0 && table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            disabled={selectableRows.length === 0}
          />
        );
      },
      cell: ({ row }) =>
        row.getCanSelect() ? (
          <DataTableColumnCheckbox row={row} />
        ) : (
          <div className="size-4" onClick={(event) => event.stopPropagation()} />
        ),
      enableSorting: false,
      enableHiding: false,
      meta: { className: 'w-10' },
    },
    {
      id: 'refund_id',
      accessorKey: 'refund_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="返金ID" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.refund_id}</span>
      ),
    },
    {
      id: 'store_name',
      accessorKey: 'store_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="店舗" />,
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
    },
    {
      id: 'member_name',
      accessorKey: 'member_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="会員名" />,
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.member_name}</span>,
    },
    {
      id: 'product_name',
      accessorKey: 'product_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="対象商品" />,
      enableSorting: false,
      cell: ({ row }) => (
        <TextWithTooltip text={row.original.product_name} className="max-w-40 text-xs" />
      ),
    },
    {
      id: 'sale_amount',
      accessorKey: 'sale_amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="売上額" className="ml-auto justify-end" />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right text-xs tabular-nums">{formatYen(row.original.sale_amount)}</div>
      ),
    },
    {
      id: 'refund_amount',
      accessorKey: 'refund_amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="返金額" className="ml-auto justify-end" />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right text-xs font-medium tabular-nums">
          {formatYen(row.original.refund_amount)}
        </div>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-1 py-0 text-[10px] ${getRefundStatusBadgeClasses(row.original.status)}`}
        >
          {REFUND_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'payment_method',
      accessorKey: 'payment_method',
      header: ({ column }) => <DataTableColumnHeader column={column} title="決済手段" />,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs">{PAYMENT_METHOD_LABELS[row.original.payment_method]}</span>
      ),
    },
    {
      id: 'requested_at',
      accessorKey: 'requested_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="申請" />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="truncate text-xs">{row.original.requester_name}</span>
            <Badge
              variant="outline"
              className="bg-muted/60 text-muted-foreground border-border shrink-0 px-1 py-0 text-[9px]"
            >
              {REQUESTER_ROLE_BADGE_LABELS[row.original.requester_role]}
            </Badge>
          </div>
          <span className="text-muted-foreground text-[10px]">
            {formatDateYYYYMMDD_HHMM(row.original.requested_at, '-')}
          </span>
        </div>
      ),
    },
    {
      id: 'approved_at',
      accessorKey: 'approved_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="承認" />,
      enableSorting: true,
      cell: ({ row }) =>
        row.original.approver_name ? (
          <div className="flex flex-col">
            <span className="text-xs">{row.original.approver_name}</span>
            <span className="text-muted-foreground text-[10px]">
              {formatDateYYYYMMDD_HHMM(row.original.approved_at, '-')}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        ),
    },
  ];
}
