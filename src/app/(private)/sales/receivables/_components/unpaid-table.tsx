'use client';

// Client component: interactive Select filter, row click, dropdown menu actions, and the
// filtered/paginated receivables fetch (this table's only consumer) require the browser.
import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmBillingRecordsReceivablesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { UnpaidReceivable } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  formatYen,
  getReceivableStatusBadgeClass,
  getReceivableStatusLabel,
} from '../_utils/receivable-status.util';

const ALL_MONTHS_VALUE = 'all';

interface UnpaidTableProps {
  unfilteredTotalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  monthOptions: string[];
  monthFilter: string | null;
  onMonthFilterChange: (month: string | null) => void;
  onRowClick: (row: UnpaidReceivable) => void;
  onIssueConvenience: (memberId: string, memberName: string) => void;
  onBadDebtAction: (memberId: string, memberName: string, mode: 'exclude' | 'release') => void;
}

export function UnpaidTable({
  unfilteredTotalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  monthOptions,
  monthFilter,
  onMonthFilterChange,
  onRowClick,
  onIssueConvenience,
  onBadDebtAction,
}: Readonly<UnpaidTableProps>) {
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmBillingRecordsReceivablesOptions({
      query: {
        unpaid_month: monthFilter ?? undefined,
        page: currentPage,
        page_size: pageSize,
      },
    }),
  );

  const items = data?.items ?? [];
  const totalCount = data?.total_count ?? 0;

  const clearFilters = () => onMonthFilterChange(null);

  const columns: ColumnDef<UnpaidReceivable>[] = [
    {
      id: 'store_name',
      header: '店舗',
      cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
    },
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
      id: 'unpaid_months',
      header: '未納月',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.unpaid_months.map((month) => (
            <Badge
              key={month}
              variant="outline"
              className="border-warning/40 text-warning bg-warning/15 px-1 py-0 text-[10px]"
            >
              {month}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'total_unpaid_amount',
      header: () => <div className="text-right">未納金額合計</div>,
      cell: ({ row }) => (
        <div className="text-destructive text-right text-sm font-semibold tabular-nums">
          {formatYen(row.original.total_unpaid_amount)}
        </div>
      ),
    },
    {
      id: 'last_billing_date',
      header: '最終請求日',
      cell: ({ row }) => <span className="text-xs">{row.original.last_billing_date}</span>,
    },
    {
      id: 'payment_method',
      header: '決済手段',
      cell: ({ row }) => <span className="text-xs uppercase">{row.original.payment_method}</span>,
    },
    {
      id: 'receivable_status',
      header: 'ステータス',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-1 py-0 text-[10px] ${getReceivableStatusBadgeClass(row.original.receivable_status)}`}
        >
          {getReceivableStatusLabel(row.original.receivable_status)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex size-7 items-center justify-center rounded-md">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <RoleGatedMenuItem
                requiredPermission={Permission.SalesConvenienceIssue}
                onClick={() => onIssueConvenience(row.original.member_id, row.original.member_name)}
              >
                コンビニ決済URL発行
              </RoleGatedMenuItem>
              {row.original.receivable_status === 'bad_debt_excluded' ? (
                <RoleGatedMenuItem
                  requiredPermission={Permission.SalesBadDebtExclude}
                  onClick={() =>
                    onBadDebtAction(row.original.member_id, row.original.member_name, 'release')
                  }
                >
                  貸倒対象外指定の解除
                </RoleGatedMenuItem>
              ) : (
                <RoleGatedMenuItem
                  requiredPermission={Permission.SalesBadDebtExclude}
                  onClick={() =>
                    onBadDebtAction(row.original.member_id, row.original.member_name, 'exclude')
                  }
                >
                  貸倒対象外指定
                </RoleGatedMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-0 overflow-hidden rounded-xl border py-0">
        <div className="px-4 py-3">
          <Select
            value={monthFilter ?? ALL_MONTHS_VALUE}
            onValueChange={(value) =>
              onMonthFilterChange(value === ALL_MONTHS_VALUE ? null : value)
            }
            items={toSelectItems([
              { value: ALL_MONTHS_VALUE, label: 'すべての未納月' },
              ...monthOptions.map((month) => ({ value: month, label: month })),
            ])}
          >
            <SelectTrigger className="h-8 w-45 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MONTHS_VALUE}>すべての未納月</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FilterResultBanner
          show={Boolean(monthFilter)}
          totalCount={unfilteredTotalCount}
          filteredCount={totalCount}
          filterSummary={monthFilter ? `未納月 ${monthFilter}` : undefined}
          onClear={clearFilters}
        />

        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={false}
          onRetry={() => refetch()}
          skeleton={
            <DataTable
              columns={columns}
              data={[]}
              isLoading
              variant="simple"
              className="rounded-none border-x-0 border-b-0"
            />
          }
        >
          <DataTable
            columns={columns}
            data={items}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            onRowClick={onRowClick}
            emptyContent={
              <Empty
                variant={monthFilter ? 'filtered' : 'empty'}
                entityLabel="未回収データ"
                onAction={monthFilter ? clearFilters : undefined}
              />
            }
          />
        </DataStateBoundary>

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
    </div>
  );
}
