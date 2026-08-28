'use client';

// Client component: nuqs-backed tab/filter/pagination state and React Query hooks need the browser.
import { Suspense, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';

import { Error as ErrorState } from '@/components/common/data-state-boundary/error';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { SummaryCard } from '@/components/common/summary-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  getCrmBillingRecordsReceivablesOptions,
  getCrmBillingRecordsUpcomingBillingOptions,
} from '@/lib/api/@tanstack/react-query.gen';

import { Permission } from '@/types/permission.type';

import type { BadDebtDialogMode } from './_components/bad-debt-exclusion-dialog';
import { BadDebtExclusionDialog } from './_components/bad-debt-exclusion-dialog';
import { ConveniencePaymentDialog } from './_components/convenience-payment-dialog';
import { UnpaidDetailSheet } from './_components/unpaid-detail-sheet';
import { UnpaidTable } from './_components/unpaid-table';
import { UpcomingBillingConfirmDialog } from './_components/upcoming-billing-confirm-dialog';
import { UpcomingBillingSummaryCards } from './_components/upcoming-billing-summary-cards';
import { UpcomingBillingTable } from './_components/upcoming-billing-table';
import { useReceivablesFilters } from './_hooks/use-receivables-filters.hook';

function TabCountBadge({ count }: Readonly<{ count: number | undefined }>) {
  return (
    <Badge
      variant="outline"
      className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
    >
      {count ?? 0}
    </Badge>
  );
}

// Formats a bare number for use alongside SummaryCard's separate `prefix="¥"` prop.
// Not reused from `_utils/receivable-status.util`'s `formatYen`, which embeds the ¥ sign itself.
function formatYen(amount: number): string {
  return amount.toLocaleString('ja-JP');
}

interface ConvenienceDialogState {
  memberId: string;
  memberName: string;
  lineItemIds?: string[];
}

interface BadDebtDialogState {
  memberId: string;
  memberName: string;
  mode: BadDebtDialogMode;
  lineItemIds?: string[];
}

function ReceivablesPageContent() {
  const {
    filters,
    setTab,
    setMonthFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    upcomingPage,
    setUpcomingPage,
    upcomingPageSize,
    setUpcomingPageSize,
  } = useReceivablesFilters();

  const [unpaidDetailMemberId, setUnpaidDetailMemberId] = useState<string | null>(null);
  const [convenienceDialog, setConvenienceDialog] = useState<ConvenienceDialogState | null>(null);
  const [badDebtDialog, setBadDebtDialog] = useState<BadDebtDialogState | null>(null);
  const [confirmBillingOpen, setConfirmBillingOpen] = useState(false);

  // Unfiltered, full-scope fetch: drives the tab badge count, summary cards, and the month
  // filter's option list — all of which must reflect the whole scoped set, not the current
  // month-filtered page (mirrors the UI prototype's client-side "scopedReceivables").
  const {
    data: unpaidAllData,
    isLoading: unpaidAllLoading,
    isError: unpaidAllIsError,
    refetch: refetchUnpaidAll,
  } = useQuery(getCrmBillingRecordsReceivablesOptions({ query: { page: 1, page_size: 200 } }));

  const {
    data: upcomingData,
    isLoading: upcomingLoading,
    isError: upcomingIsError,
    refetch: refetchUpcoming,
  } = useQuery(
    getCrmBillingRecordsUpcomingBillingOptions({
      query: { page: upcomingPage, page_size: upcomingPageSize },
    }),
  );

  const unpaidAllItems = unpaidAllData?.items ?? [];
  const monthOptions = Array.from(
    new Set(unpaidAllItems.flatMap((item) => item.unpaid_months)),
  ).sort();
  const totalUnpaidAmount = unpaidAllItems.reduce((sum, item) => sum + item.total_unpaid_amount, 0);
  const badDebtCount = unpaidAllItems.filter(
    (item) => item.receivable_status === 'bad_debt_target',
  ).length;
  const convenienceCount = unpaidAllItems.filter(
    (item) => item.receivable_status === 'convenience_payment_in_progress',
  ).length;

  const unfilteredTotalCount = unpaidAllData?.total_count ?? 0;

  const upcomingItems = upcomingData?.items ?? [];
  const upcomingTotalCount = upcomingData?.total_count ?? 0;
  const upcomingSummary = upcomingData?.summary;

  return (
    <>
      <PageHeader title="請求・未回収管理" />

      <div className="bg-background flex flex-1 flex-col px-6 py-4">
        <Tabs
          value={filters.rf_tab}
          onValueChange={(value) => setTab(value === 'upcoming' ? 'upcoming' : 'receivable')}
          className="gap-4"
        >
          <TabsList variant="line">
            <TabsTrigger value="receivable" className="text-sm">
              未回収一覧
              <TabCountBadge count={unfilteredTotalCount} />
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-sm">
              翌月請求予定
              <TabCountBadge count={upcomingTotalCount} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receivable">
            {unpaidAllIsError ? (
              <ErrorState onRetry={() => refetchUnpaidAll()} />
            ) : (
              <div className="flex flex-col gap-6">
                {unpaidAllLoading ? (
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="gap-0 py-4">
                        <CardContent className="px-4">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="mt-2 h-7 w-20" />
                          <Skeleton className="mt-1 h-3 w-24" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    <SummaryCard title="未回収件数" value={`${unfilteredTotalCount}`} suffix="件" />
                    <SummaryCard
                      title="未回収総額"
                      value={formatYen(totalUnpaidAmount)}
                      prefix="¥"
                      tone="destructive"
                      subValue="累計（当月超過分含む）"
                    />
                    <SummaryCard
                      title="貸倒対象件数"
                      value={`${badDebtCount}`}
                      suffix="件"
                      tone="muted"
                    />
                    <SummaryCard
                      title="コンビニ決済中"
                      value={`${convenienceCount}`}
                      suffix="件"
                      tone="info"
                    />
                  </div>
                )}

                <UnpaidTable
                  unfilteredTotalCount={unfilteredTotalCount}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  monthOptions={monthOptions}
                  monthFilter={filters.rf_month}
                  onMonthFilterChange={setMonthFilter}
                  onRowClick={(row) => setUnpaidDetailMemberId(row.member_id)}
                  onIssueConvenience={(memberId, memberName) =>
                    setConvenienceDialog({ memberId, memberName })
                  }
                  onBadDebtAction={(memberId, memberName, mode) =>
                    setBadDebtDialog({ memberId, memberName, mode })
                  }
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingIsError ? (
              <ErrorState onRetry={() => refetchUpcoming()} />
            ) : (
              <div className="flex flex-col gap-4">
                <UpcomingBillingSummaryCards
                  summary={upcomingSummary}
                  isLoading={upcomingLoading}
                />

                <div className="flex justify-end">
                  <RoleGatedButton
                    requiredPermission={Permission.SalesUpcomingBillingConfirm}
                    denyTooltip="請求確定の権限がありません"
                    disabled={upcomingTotalCount === 0}
                    className="gap-2"
                    onClick={() => setConfirmBillingOpen(true)}
                  >
                    <Lock className="size-4" />
                    未確定の{upcomingTotalCount}件を確定する
                  </RoleGatedButton>
                </div>

                <UpcomingBillingTable
                  items={upcomingItems}
                  isLoading={upcomingLoading}
                  totalCount={upcomingTotalCount}
                  currentPage={upcomingPage}
                  pageSize={upcomingPageSize}
                  onPageChange={setUpcomingPage}
                  onPageSizeChange={setUpcomingPageSize}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <UnpaidDetailSheet
        memberId={unpaidDetailMemberId}
        open={!!unpaidDetailMemberId}
        onOpenChange={(open) => {
          if (!open) setUnpaidDetailMemberId(null);
        }}
        onIssueConvenience={(memberId, memberName, lineItemIds) =>
          setConvenienceDialog({ memberId, memberName, lineItemIds })
        }
        onBadDebtAction={(memberId, memberName, mode, lineItemIds) =>
          setBadDebtDialog({ memberId, memberName, mode, lineItemIds })
        }
      />

      <ConveniencePaymentDialog
        open={!!convenienceDialog}
        onOpenChange={(open) => {
          if (!open) setConvenienceDialog(null);
        }}
        memberId={convenienceDialog?.memberId ?? ''}
        memberName={convenienceDialog?.memberName ?? ''}
        lineItemIds={convenienceDialog?.lineItemIds}
      />

      <BadDebtExclusionDialog
        open={!!badDebtDialog}
        onOpenChange={(open) => {
          if (!open) setBadDebtDialog(null);
        }}
        memberId={badDebtDialog?.memberId ?? ''}
        memberName={badDebtDialog?.memberName ?? ''}
        mode={badDebtDialog?.mode ?? 'exclude'}
        lineItemIds={badDebtDialog?.lineItemIds}
      />

      <UpcomingBillingConfirmDialog
        open={confirmBillingOpen}
        onOpenChange={setConfirmBillingOpen}
        summary={upcomingSummary}
      />
    </>
  );
}

export default function SalesReceivablesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ReceivablesPageContent />
    </Suspense>
  );
}
