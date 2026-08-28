import type { ColumnDef } from '@tanstack/react-table';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import type { UpcomingBillingEntry } from '@/lib/api/types.gen';

import { formatYen } from '../_utils/receivable-status.util';

const BILLING_TYPE_LABELS: Record<UpcomingBillingEntry['billing_type'], string> = {
  standard: '月次請求',
  with_unpaid_rollover: '月次請求（未納金加算）',
  ad_hoc: '都度請求',
};

interface UpcomingBillingTableProps {
  items: UpcomingBillingEntry[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function UpcomingBillingTable({
  items,
  isLoading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Readonly<UpcomingBillingTableProps>) {
  const columns: ColumnDef<UpcomingBillingEntry>[] = [
    {
      id: 'member_id',
      header: '会員ID',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.member_id}</span>
      ),
    },
    {
      id: 'member_name',
      header: '氏名',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.member_name}</span>,
    },
    {
      id: 'billing_type',
      header: '請求区分',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-1 py-0 text-[10px] ${
            row.original.billing_type === 'with_unpaid_rollover'
              ? 'bg-warning/15 text-warning border-warning/20'
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {BILLING_TYPE_LABELS[row.original.billing_type]}
        </Badge>
      ),
    },
    {
      id: 'payment_method',
      header: '決済手段',
      cell: ({ row }) => <span className="text-xs uppercase">{row.original.payment_method}</span>,
    },
    {
      id: 'amount',
      header: () => <div className="text-right">請求金額</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-semibold tabular-nums">
          {formatYen(row.original.amount)}
        </div>
      ),
    },
    {
      id: 'billing_month',
      header: '請求予定月',
      cell: ({ row }) => <span className="text-xs">{row.original.billing_month}</span>,
    },
    {
      id: 'status',
      header: 'ステータス',
      cell: () => (
        <Badge
          variant="outline"
          className="bg-warning/15 text-warning border-warning/20 px-1 py-0 text-[10px]"
        >
          未確定
        </Badge>
      ),
    },
    {
      id: 'note',
      header: '備考',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.note || '-'}</span>
      ),
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border py-0">
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        variant="simple"
        className="rounded-none border-x-0 border-b-0"
        emptyContent={
          <Empty variant="empty" title="翌月請求予定はありません" entityLabel="請求予定" />
        }
      />

      {totalCount > 0 && (
        <TablePaginationWithSize
          total={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[25, 50, 100, 200]}
        />
      )}
    </Card>
  );
}
