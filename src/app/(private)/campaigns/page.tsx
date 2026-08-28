'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import {
  deleteCrmCampaignsByIdMutation,
  getCrmCampaignsOptions,
  getCrmCampaignsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import type { CampaignListItemResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { CampaignDeleteDialog } from './_components/campaign-delete-dialog';
import { CampaignsFilters } from './_components/campaigns-filters';
import { CampaignsTableColumns } from './_components/campaigns-table-columns';
import {
  CAMPAIGN_ACCEPT_STATE_LABELS,
  getCampaignTableMaxHeightClass,
} from './_constants/constants';
import { CampaignsFiltersProvider } from './_contexts/campaigns-filters-context';
import { useCampaignsFilters } from './_hooks/use-campaigns-filters';

function CampaignsPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CampaignListItemResponse | null>(null);

  const filtersHook = useCampaignsFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize, setPageSize } =
    filtersHook;

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmCampaignsOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const campaigns = data?.items ?? [];
  const pagination = data?.pagination;
  const totalCampaigns = pagination?.totalItems ?? 0;
  const totalAllCampaigns = pagination?.totalAllItems ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const deleteMutation = useMutation({
    ...deleteCrmCampaignsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'キャンペーンを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmCampaignsQueryKey() });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('適用中の会員または申請があるため削除できません');
    },
  });

  const sorting: SortingState = [{ id: filters.sort, desc: filters.order === 'desc' }];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    if (next.length === 0) {
      setFilters({ sort: 'createdAt', order: 'desc' });
      return;
    }
    setFilters({
      sort: next[0].id as typeof filters.sort,
      order: next[0].desc ? 'desc' : 'asc',
    });
  };

  const columns = useMemo(() => CampaignsTableColumns({ onDeleteClick: setDeleteTarget }), []);

  return (
    <>
      <PageHeader
        title="キャンペーン管理"
        badge={
          <Badge
            variant="outline"
            className="text-muted-foreground text-xs font-normal tabular-nums"
          >
            {totalAllCampaigns.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.CampaignsCreate}
            onClick={() => router.push(navigate('/campaigns/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <div className="px-4 py-3">
            <CampaignsFiltersProvider value={filtersHook}>
              <CampaignsFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </CampaignsFiltersProvider>
          </div>

          {/* 抽出結果は検索行の直下に固定する。条件クリアはこのバナーと、絞り込み0件時の
              空状態（PAR046）の2箇所から実行できる（他の一覧画面と同じ挙動）。 */}
          <FilterResultBanner
            show={filtersHook.hasActiveFilters}
            totalCount={totalAllCampaigns}
            filteredCount={totalCampaigns}
            filterSummary={[
              filters.nameQuery ? `"${filters.nameQuery}"` : '',
              filters.brandEnum ? (BRAND_LABELS[filters.brandEnum] ?? filters.brandEnum) : '',
              filters.acceptState ? CAMPAIGN_ACCEPT_STATE_LABELS[filters.acceptState] : '',
              filters.recruitmentFrom ? `募集開始: ${filters.recruitmentFrom}以降` : '',
              filters.recruitmentTo ? `募集終了: ${filters.recruitmentTo}以前` : '',
            ]}
            onClear={filtersHook.clearFilters}
          />

          <DataStateBoundary
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && campaigns.length === 0}
            onRetry={() => refetch()}
            errorTitle="キャンペーン一覧の取得に失敗しました"
            emptyState={{
              variant: filtersHook.hasActiveFilters ? 'filtered' : 'empty',
              entityLabel: 'キャンペーン',
              onAction: filtersHook.hasActiveFilters ? filtersHook.clearFilters : undefined,
            }}
            skeleton={
              <DataTable
                tableSize="md"
                columns={columns}
                data={[]}
                isLoading
                variant="simple"
                className="rounded-none border-x-0 border-b-0"
                containerClassName={getCampaignTableMaxHeightClass(
                  isFilterOpen,
                  filtersHook.hasActiveFilters,
                )}
              />
            }
          >
            <DataTable
              tableSize="md"
              columns={columns}
              data={campaigns}
              variant="simple"
              className={`rounded-none border-x-0 border-b-0 ${isFetching ? 'opacity-80' : ''}`}
              containerClassName={getCampaignTableMaxHeightClass(
                isFilterOpen,
                filtersHook.hasActiveFilters,
              )}
              onRowClick={(row) => {
                router.push(navigate('/campaigns/[id]', row.id));
              }}
              tableOptions={{
                onSortingChange: handleSortingChange,
                manualSorting: true,
                state: { sorting },
              }}
            />
          </DataStateBoundary>

          {totalCampaigns > 0 && !isError && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalCampaigns}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <CampaignDeleteDialog
        campaign={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({ path: { id: deleteTarget.id } });
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CampaignsPageContent />
    </Suspense>
  );
}
