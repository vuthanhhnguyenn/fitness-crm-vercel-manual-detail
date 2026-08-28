'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Error as ErrorState } from '@/components/common/data-state-boundary/error';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { RoleGatedButton } from '@/components/common/role-gated-button';

import { getCrmBrandsByIdFeesOptions } from '@/lib/api/@tanstack/react-query.gen';

import { Permission } from '@/types/permission.type';

import type { BrandFeeGroup } from '../_types/brand-fee.type';
import { BrandFeeGroupEditSheet } from './brand-fee-group-edit-sheet';
import { FeeEmptyState } from './fee-empty-state';
import { FeeGroupCard } from './fee-group-card';
import { FeeGroupDeleteDialog } from './fee-group-delete-dialog';
import { FeeGroupDisableDialog } from './fee-group-disable-dialog';

export function FeesTab({ brandId }: { brandId: string }) {
  const [editingFeeGroup, setEditingFeeGroup] = useState<BrandFeeGroup | null>(null);
  const [disablingFeeGroup, setDisablingFeeGroup] = useState<BrandFeeGroup | null>(null);
  const [deletingFeeGroup, setDeletingFeeGroup] = useState<BrandFeeGroup | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmBrandsByIdFeesOptions({ path: { id: brandId } }),
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <ErrorState title="費用データが見つかりません" onRetry={refetch} />;
  }

  const isEmpty = !data || data.fee_groups.length === 0;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-muted-foreground max-w-3xl text-xs leading-5">
            サブブランド単位の費用マスタ（入会金・登録事務手数料）を管理します。金額は税込で表示されています。
          </p>
          <RoleGatedButton
            type="button"
            variant="outline"
            className="text-muted-foreground/50 h-8 gap-1 self-start rounded-md px-3 text-xs"
            requiredPermission={Permission.BrandsEdit}
            disabled
            tooltip="費用マスタの新規登録は次フェーズで実装予定です"
          >
            <Plus className="size-3.5" />
            新規登録
          </RoleGatedButton>
        </div>

        {isEmpty ? (
          <FeeEmptyState />
        ) : (
          <div className="space-y-4">
            {data.fee_groups.map((feeGroup) => (
              <FeeGroupCard
                key={feeGroup.sub_brand_code}
                feeGroup={feeGroup}
                hasMultipleSubBrands={data.fee_groups.length > 1}
                onEdit={setEditingFeeGroup}
                onDisable={setDisablingFeeGroup}
                onDelete={setDeletingFeeGroup}
              />
            ))}
          </div>
        )}
      </div>

      <BrandFeeGroupEditSheet
        brandId={brandId}
        feeGroup={editingFeeGroup}
        onOpenChange={(open) => {
          if (!open) setEditingFeeGroup(null);
        }}
      />

      <FeeGroupDisableDialog
        brandId={brandId}
        feeGroup={disablingFeeGroup}
        onOpenChange={(open) => {
          if (!open) setDisablingFeeGroup(null);
        }}
      />

      <FeeGroupDeleteDialog
        brandId={brandId}
        feeGroup={deletingFeeGroup}
        onOpenChange={(open) => {
          if (!open) setDeletingFeeGroup(null);
        }}
      />
    </>
  );
}
