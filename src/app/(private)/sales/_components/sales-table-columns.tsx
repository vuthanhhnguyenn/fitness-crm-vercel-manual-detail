'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnCheckbox } from '@/components/common/data-table/data-table-column-checkbox';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import type { BillingRecordListItem } from '@/lib/api/types.gen';

function formatYen(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`;
}

const BILLING_TYPE_LABELS: Record<BillingRecordListItem['billing_type'], string> = {
  monthly: '月次請求',
  ad_hoc: '都度請求',
  manual: '手動請求',
};

const REFUND_STATUS_LABELS: Record<BillingRecordListItem['refund_status'], string> = {
  none: '',
  pending: '返金申請中',
  approved: '返金承認済み',
  completed: '返金済み',
  rejected: '返金却下',
};

function getConfirmStatusBadgeClass(status: BillingRecordListItem['confirmation_status']) {
  return status === 'confirmed'
    ? 'bg-success/15 text-success border-success/20'
    : 'bg-warning/15 text-warning border-warning/20';
}

function getRefundStatusBadgeClass(status: BillingRecordListItem['refund_status']) {
  switch (status) {
    case 'completed':
      return 'bg-info/15 text-info border-info/20';
    case 'pending':
    case 'approved':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'rejected':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return '';
  }
}

export function getSalesTableColumns(): ColumnDef<BillingRecordListItem>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="w-10 px-2">
          <Checkbox
            aria-label="Select all"
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="請求ID" />,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>
      ),
    },
    {
      id: 'store_name',
      accessorKey: 'store_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="店舗" />,
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <p className="text-xs">{row.original.store_name}</p>
          <p className="text-muted-foreground text-[10px]">ID: {row.original.store_id}</p>
        </div>
      ),
    },
    {
      id: 'member_name',
      accessorKey: 'member_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="利用者" />,
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium">{row.original.member_name}</p>
          <p className="text-muted-foreground text-[10px]">{row.original.member_id}</p>
        </div>
      ),
    },
    {
      id: 'billing_type',
      accessorKey: 'billing_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="請求区分" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {BILLING_TYPE_LABELS[row.original.billing_type]}
        </Badge>
      ),
    },
    {
      id: 'payment_method',
      accessorKey: 'payment_method',
      header: ({ column }) => <DataTableColumnHeader column={column} title="決済手段" />,
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs font-normal uppercase">
          {row.original.payment_method}
        </Badge>
      ),
    },
    {
      id: 'billed_amount',
      accessorKey: 'billed_amount',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="請求額(税込)"
          className="ml-auto justify-end"
        />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right text-xs tabular-nums">
          {formatYen(row.original.billed_amount)}
        </div>
      ),
    },
    {
      id: 'outstanding_amount',
      accessorKey: 'outstanding_amount',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="未納金(税込)"
          className="ml-auto justify-end"
        />
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const isUnpaid = row.original.outstanding_amount > 0;
        return (
          <div
            className={`text-right text-xs tabular-nums ${isUnpaid ? 'text-destructive font-medium' : ''}`}
          >
            {isUnpaid ? formatYen(row.original.outstanding_amount) : '—'}
          </div>
        );
      },
    },
    {
      id: 'confirmation_status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={`px-1 py-0 text-[10px] ${getConfirmStatusBadgeClass(row.original.confirmation_status)}`}
          >
            {row.original.confirmation_status === 'confirmed' ? '確定済' : '未確定'}
          </Badge>
          {row.original.refund_status !== 'none' && (
            <Badge
              variant="outline"
              className={`px-1 py-0 text-[10px] ${getRefundStatusBadgeClass(row.original.refund_status)}`}
            >
              {REFUND_STATUS_LABELS[row.original.refund_status]}
            </Badge>
          )}
        </div>
      ),
    },
  ];
}
