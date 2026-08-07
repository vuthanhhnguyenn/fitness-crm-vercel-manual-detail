'use client';

import { Suspense, useMemo, useState } from 'react';

import { useParams } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  getCrmBrandsByIdOptions,
  getCrmBrandsByIdQueryKey,
  getCrmBrandsQueryKey,
  patchCrmBrandsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmBrandsByIdResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { BrandFormSheet } from '../_components/brand-form-sheet';
import type { BrandFormValues } from '../_schemas/brand-form.schema';
import { BasicInfoTab } from './_components/basic-info-tab';
import { BrandStatusBadge } from './_components/brand-status-badge';
import { FeesTab } from './_components/fees-tab';
import { HistoryTab } from './_components/history-tab';

function buildInitialValues(
  brand: NonNullable<GetCrmBrandsByIdResponse>['brand'],
): BrandFormValues {
  return {
    brandId: brand.brand_id,
    displayName: brand.display_name,
  };
}

function BrandDetailPageContent() {
  const params = useParams();
  const queryClient = useQueryClient();

  const brandId = params.id as string;
  const [activeTab, setActiveTab] = useState('basic');
  const [sheetOpen, setSheetOpen] = useState(false);

  const detailQuery = useQuery({
    ...getCrmBrandsByIdOptions({ path: { id: brandId } }),
  });

  const updateMutation = useMutation({
    ...patchCrmBrandsByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdQueryKey({ path: { id: brandId } }),
        refetchType: 'all',
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmBrandsQueryKey(),
        refetchType: 'all',
      });
      setSheetOpen(false);
    },
  });

  const detailData = detailQuery.data;
  const brand = detailData?.brand;

  const feeCount = brand?.fee_group_count ?? 0;
  const historyCount = brand?.change_history_count ?? 0;

  const initialValues = useMemo(
    () => (brand ? buildInitialValues(brand) : { brandId: '', displayName: '' }),
    [brand],
  );

  const handleSaveBrand = (values: BrandFormValues, onError: (message: string) => void) => {
    updateMutation.mutate(
      {
        path: { id: brandId },
        body: {
          display_name: values.displayName.trim(),
          brand_id: values.brandId.trim().toLowerCase(),
        },
      },
      {
        onError: (error) => {
          if (
            error &&
            typeof error === 'object' &&
            'error' in error &&
            typeof error.error === 'string'
          ) {
            onError(error.error);
            return;
          }

          onError('ブランド設定の更新に失敗しました。後で再試行してください。');
        },
      },
    );
  };

  return (
    <DataStateBoundary
      isLoading={detailQuery.isLoading}
      isError={detailQuery.isError}
      isEmpty={!brand}
      onRetry={() => detailQuery.refetch()}
      emptyTitle="ブランドが見つかりません"
    >
      {brand && (
        <div className="bg-background flex min-h-0 flex-1 flex-col">
          <PageHeader
            breadcrumb={<BackLink label="ブランド管理に戻る" href="/brands" />}
            title={brand.display_name}
            className="[&_h1]:text-[18px] [&_h1]:leading-7"
            badge={<BrandStatusBadge status={brand.status} />}
          />

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-between gap-4 px-3 pt-4">
              <TabsList className="bg-muted h-15 rounded-[10px] px-0.75 py-0.75 shadow-none">
                <TabsTrigger
                  value="basic"
                  className="text-3.25 h-6 rounded-md px-1.5 text-xs font-normal shadow-none"
                >
                  基本情報
                </TabsTrigger>
                <TabsTrigger
                  value="fees"
                  className="h-6 rounded-md px-1.5 text-xs text-[14px] font-normal"
                >
                  費用
                  <Badge
                    variant="outline"
                    className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 py-0 text-[10px] font-medium tabular-nums"
                  >
                    {feeCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="h-6 rounded-md px-1.5 text-xs text-[14px] font-normal"
                >
                  変更履歴
                  <Badge
                    variant="outline"
                    className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 py-0 text-[10px] font-medium tabular-nums"
                  >
                    {historyCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {activeTab === 'basic' && (
                <RoleGatedButton
                  type="button"
                  variant="outline"
                  className="h-8 gap-1 rounded-md px-3 text-xs font-medium"
                  requiredPermission={Permission.BrandsEdit}
                  onClick={() => setSheetOpen(true)}
                >
                  <Pencil className="size-3.5" />
                  基本情報を編集
                </RoleGatedButton>
              )}
            </div>

            <TabsContent value="basic" className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
              <BasicInfoTab brand={brand} />
            </TabsContent>

            <TabsContent value="fees" className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
              {activeTab === 'fees' ? <FeesTab brandId={brandId} /> : null}
            </TabsContent>

            <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
              {activeTab === 'history' ? <HistoryTab brandId={brandId} /> : null}
            </TabsContent>
          </Tabs>

          <BrandFormSheet
            open={sheetOpen}
            mode="edit"
            initialValues={initialValues}
            isSubmitting={updateMutation.isPending}
            onOpenChange={setSheetOpen}
            onSave={handleSaveBrand}
          />
        </div>
      )}
    </DataStateBoundary>
  );
}

export default function BrandDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BrandDetailPageContent />
    </Suspense>
  );
}
