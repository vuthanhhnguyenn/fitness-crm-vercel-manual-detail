'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { RotateCcw } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';

import type { TransactionRecord } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

function formatYen(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionRecord['transaction_type'], string> = {
  sale: '売上',
  refund: '返金',
  payment: '入金',
  repayment: '払戻',
};

const STATUS_LABELS: Record<TransactionRecord['status'], string> = {
  confirmed: '確定',
  processing: '処理中',
  canceled: 'キャンセル',
  uncollected: '未収',
};

function getTransactionTypeBadgeClass(type: TransactionRecord['transaction_type']): string {
  switch (type) {
    case 'sale':
      return 'bg-success/15 text-success border-success/20';
    case 'refund':
      return 'bg-destructive/15 text-destructive border-destructive/20';
    case 'payment':
      return 'bg-info/15 text-info border-info/20';
    case 'repayment':
      return 'bg-warning/15 text-warning border-warning/20';
  }
}

function getStatusBadgeClass(status: TransactionRecord['status']): string {
  switch (status) {
    case 'confirmed':
      return 'bg-success/15 text-success border-success/20';
    case 'processing':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'canceled':
      return 'bg-muted text-muted-foreground border-border';
    case 'uncollected':
      return 'bg-destructive/15 text-destructive border-destructive/20';
  }
}

interface GetTransactionsTableColumnsOptions {
  onRequestRefund: (row: TransactionRecord) => void;
}

export function getTransactionsTableColumns({
  onRequestRefund,
}: GetTransactionsTableColumnsOptions): ColumnDef<TransactionRecord>[] {
  return [
    {
      id: 'transaction_date',
      accessorKey: 'transaction_date',
      header: '取引日',
      cell: ({ row }) => <span className="text-xs">{row.original.transaction_date}</span>,
    },
    {
      id: 'member_id',
      accessorKey: 'member_id',
      header: '会員ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.member_id}</span>
      ),
    },
    {
      id: 'member_name',
      accessorKey: 'member_name',
      header: '氏名',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.member_name}</span>,
    },
    {
      id: 'store_name',
      accessorKey: 'store_name',
      header: '店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
    },
    {
      id: 'transaction_type',
      header: '取引種別',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-1 py-0 text-[10px] font-normal ${getTransactionTypeBadgeClass(row.original.transaction_type)}`}
        >
          {TRANSACTION_TYPE_LABELS[row.original.transaction_type]}
        </Badge>
      ),
    },
    {
      id: 'billing_line_item_id',
      accessorKey: 'billing_line_item_id',
      header: '請求明細ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.billing_line_item_id}
        </span>
      ),
    },
    {
      id: 'amount_ex_tax',
      accessorKey: 'amount_ex_tax',
      header: () => <div className="text-right">税抜額</div>,
      cell: ({ row }) => (
        <div className="text-right text-xs tabular-nums">
          {row.original.amount_ex_tax.toLocaleString('ja-JP')}
        </div>
      ),
    },
    {
      id: 'tax_rate',
      accessorKey: 'tax_rate',
      header: () => <div className="text-right">税率</div>,
      cell: ({ row }) => <div className="text-right text-xs">{row.original.tax_rate}%</div>,
    },
    {
      id: 'amount_inc_tax',
      accessorKey: 'amount_inc_tax',
      header: () => <div className="text-right">税込額</div>,
      cell: ({ row }) => (
        <div className="text-right text-xs font-medium tabular-nums">
          {formatYen(row.original.amount_inc_tax)}
        </div>
      ),
    },
    {
      id: 'payment_method',
      accessorKey: 'payment_method',
      header: '決済手段',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs font-normal uppercase">
          {row.original.payment_method}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'ステータス',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-1 py-0 text-[10px] font-normal ${getStatusBadgeClass(row.original.status)}`}
        >
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const record = row.original;
        // FR-004: 各明細行から返金申請へ遷移可能 — 確定した「売上」取引のみ対象。
        // キャンセル済み/売上以外の行は返金対象外（キャンセル済みは理由付きで disabled 表示）。
        if (record.transaction_type !== 'sale') {
          return <span className="text-muted-foreground text-[10px]">—</span>;
        }
        if (record.status === 'canceled') {
          return (
            <RoleGatedButton
              requiredPermission={Permission.SalesRefundInitiate}
              denyTooltip="返金申請の権限がありません"
              disabled
              tooltip="キャンセル済みの取引のため返金申請できません。確定した売上取引のみ申請できます"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(event) => event.stopPropagation()}
            >
              返金申請
            </RoleGatedButton>
          );
        }
        return (
          <RoleGatedButton
            requiredPermission={Permission.SalesRefundInitiate}
            denyTooltip="返金申請の権限がありません"
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={(event) => {
              event.stopPropagation();
              onRequestRefund(record);
            }}
          >
            <RotateCcw className="size-3" />
            返金申請
          </RoleGatedButton>
        );
      },
      meta: { className: 'w-30' },
    },
  ];
}
