'use client';

import { format } from 'date-fns';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Card } from '@/components/ui/card';

import type { CampaignDetailResponse } from '@/lib/api/types.gen';

import { usePromoCodesTab } from '../_hooks/use-promo-codes-tab';
import { PromoCodeCreateDialog } from './promo-code-create-dialog';
import { PromoCodeDisableDialog } from './promo-code-disable-dialog';
import { PromoCodeSearchFilters } from './promo-code-search-filters';
import { PromoCodeTable } from './promo-code-table';
import { PromoCodeUsageSummary } from './promo-code-usage-summary';

const DATE_FORMAT = 'yyyy-MM-dd';

/** 一年を超える出力はAPI側で弾かれるため、既定の出力期間は直近1年に揃える。 */
function defaultExportRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  return { from: format(from, DATE_FORMAT), to: format(to, DATE_FORMAT) };
}

export function PromoCodeSection({ campaign }: Readonly<{ campaign: CampaignDetailResponse }>) {
  const tab = usePromoCodesTab(campaign);

  const handleExport = () => {
    const { from, to } = defaultExportRange();
    const params = new URLSearchParams({ campaignId: campaign.id, from, to, encoding: 'sjis-bom' });
    window.open(`/api/crm/promo-codes/export?${params.toString()}`, '_blank');
    toast.success('CSVを出力しました');
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 px-4 py-3">
          <PromoCodeSearchFilters tab={tab} onExport={handleExport} />
        </div>

        <DataStateBoundary
          isLoading={tab.isLoading}
          isError={tab.isError}
          isEmpty={!tab.isLoading && tab.promoCodes.length === 0}
          onRetry={() => tab.refetch()}
          errorTitle="プロモーションコードの取得に失敗しました"
          emptyState={{
            variant: tab.hasActiveFilters ? 'filtered' : 'empty',
            entityLabel: 'プロモーションコード',
            onAction: tab.hasActiveFilters ? tab.clearFilters : undefined,
          }}
        >
          <PromoCodeTable tab={tab} />
        </DataStateBoundary>

        {tab.filteredCount > 0 && !tab.isError && (
          <TablePaginationWithSize
            currentPage={tab.currentPage}
            total={tab.filteredCount}
            pageSize={tab.pageSize}
            onPageChange={tab.setCurrentPage}
            onPageSizeChange={tab.setPageSize}
          />
        )}

        <PromoCodeUsageSummary
          issuedCount={tab.summary.issuedCount}
          totalUsedCount={tab.summary.totalUsedCount}
        />
      </Card>

      <PromoCodeCreateDialog campaign={campaign} tab={tab} />
      <PromoCodeDisableDialog tab={tab} />
    </div>
  );
}
