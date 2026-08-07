'use client';

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarClock, DollarSign, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Error as ErrorState } from '@/components/common/data-state-boundary/error';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Card } from '@/components/ui/card';

import {
  deleteCrmBrandsByIdFeesBySubBrandCodeMutation,
  getCrmBrandsByIdFeesOptions,
  getCrmBrandsByIdFeesQueryKey,
  getCrmBrandsByIdQueryKey,
  patchCrmBrandsByIdFeesBySubBrandCodeDisableMutation,
  patchCrmBrandsByIdFeesBySubBrandCodeMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmBrandsByIdFeesResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import type { BrandFeeGroupFormValues } from '../_schemas/brand-fee-group-form.schema';
import { BrandFeeGroupEditSheet } from './brand-fee-group-edit-sheet';
import { BrandStatusBadge } from './brand-status-badge';
import { FeeCurrentBadge } from './fee-current-badge';
import { FeeGroupDeleteDialog } from './fee-group-delete-dialog';
import { FeeGroupDisableDialog } from './fee-group-disable-dialog';

type BrandFeeGroup = GetCrmBrandsByIdFeesResponse['fee_groups'][number];
type BrandFeeItem = BrandFeeGroup['fee_items'][number];

const CIRCLED_NUMERALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'] as const;

function toCircledNumeral(value: number): string {
  return CIRCLED_NUMERALS[value - 1] ?? `${value}`;
}

function formatYen(value: number): string {
  return `¥${value.toLocaleString('ja-JP')}`;
}

function hasFeeGroupChanges(feeGroup: BrandFeeGroup, values: BrandFeeGroupFormValues): boolean {
  if (values.feeItems.length !== feeGroup.fee_items.length) {
    return true;
  }

  return values.feeItems.some((item, index) => {
    const currentItem = feeGroup.fee_items[index];
    if (!currentItem) return true;

    return (
      item.itemName.trim() !== currentItem.item_name ||
      item.effectiveStartDate !== currentItem.effective_start_date ||
      item.currentValueIncludingTaxYen !== currentItem.current_value_including_tax_yen
    );
  });
}

function FeeItemBlock({
  feeItem,
  itemNumber,
  status,
}: {
  feeItem: BrandFeeItem;
  itemNumber: number;
  status: BrandFeeGroup['status'];
}) {
  return (
    <div className="border-t px-4 pt-1 pb-3 first:border-t-0">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs leading-5 font-semibold">
          費用項目{toCircledNumeral(itemNumber)}: {feeItem.item_name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground text-xs leading-5 font-medium">現行設定</p>
          <FeeCurrentBadge status={status} />
        </div>
        <div className="mt-2 flex w-full flex-col gap-3 lg:flex-row lg:items-start">
          <div className="min-w-[220px]">
            <p className="text-muted-foreground mb-1 text-xs font-medium">定価（税込）</p>
            <p className="text-sm leading-7 font-bold">
              {formatYen(feeItem.current_value_including_tax_yen)}
            </p>
          </div>

          <div className="min-w-[220px] lg:ml-120 xl:ml-134">
            <p className="text-muted-foreground mb-1 text-xs">有効開始日</p>
            <p className="text-[14px] leading-7 font-medium">{feeItem.effective_start_date}</p>
          </div>
        </div>
      </div>

      {feeItem.scheduled_changes.length > 0 && (
        <div className="mt-4">
          <div className="mb-2.5 flex items-center gap-2">
            <CalendarClock className="text-muted-foreground size-3.5" />
            <p className="text-xs font-medium text-slate-700">予約中の改定</p>
            <span className="rounded-full bg-slate-200 px-2 py-0 text-[10px] font-medium text-slate-700">
              {feeItem.scheduled_changes.length}件
            </span>
          </div>

          <div className="space-y-2.5">
            {feeItem.scheduled_changes.map((change) => (
              <div
                key={`${change.effective_start_date}-${change.registered_at}`}
                className="rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-1.5 py-0 text-[10px] leading-5 font-semibold text-slate-700">
                        予約
                      </span>
                      <p className="font-semibold text-slate-700">
                        {change.effective_start_date} 以降適用
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-[15px] leading-6 font-bold text-slate-900">
                    {formatYen(change.value_including_tax_yen)}
                  </p>
                </div>

                <p className="text-muted-foreground mt-1.5 text-xs leading-5">
                  登録: {change.registered_at} / {change.registered_by}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeeGroupCard({
  feeGroup,
  onEdit,
  onDisable,
  onDelete,
}: {
  feeGroup: BrandFeeGroup;
  onEdit: (feeGroup: BrandFeeGroup) => void;
  onDisable: (feeGroup: BrandFeeGroup) => void;
  onDelete: (feeGroup: BrandFeeGroup) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border p-0">
      <div className="flex flex-col gap-3 border-b px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm leading-6 font-semibold text-slate-900">
            {feeGroup.parent_brand_name} / {feeGroup.display_name}
          </h3>
          <BrandStatusBadge status={feeGroup.status} showDot={false} />
          <span className="rounded-full bg-slate-100 px-2 py-0 text-[12px] font-medium text-slate-600">
            {feeGroup.fee_master_id}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RoleGatedButton
            type="button"
            variant="outline"
            className="h-7 gap-1 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium"
            requiredPermission={Permission.BrandsEdit}
            onClick={() => onEdit(feeGroup)}
          >
            <Pencil className="size-3.5" />
            編集
          </RoleGatedButton>
          <RoleGatedButton
            type="button"
            variant="outline"
            className="text-warning hover:bg-muted hover:text-warning h-7 gap-1 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium"
            requiredPermission={Permission.BrandsEdit}
            disabled={feeGroup.status === 'inactive'}
            onClick={() => onDisable(feeGroup)}
          >
            <Ban className="size-3.5" />
            無効化
          </RoleGatedButton>
          <RoleGatedButton
            type="button"
            variant="outline"
            className="text-destructive hover:bg-muted hover:text-destructive text-destructive h-7 gap-1 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium"
            requiredPermission={Permission.BrandsEdit}
            onClick={() => onDelete(feeGroup)}
          >
            <Trash2 className="size-3.5" />
            削除
          </RoleGatedButton>
        </div>
      </div>

      <div>
        {feeGroup.fee_items.map((feeItem, index) => (
          <FeeItemBlock
            key={feeItem.item_code}
            feeItem={feeItem}
            itemNumber={index + 1}
            status={feeGroup.status}
          />
        ))}
      </div>
    </Card>
  );
}

function FeeEmptyState() {
  return (
    <Card className="flex min-h-[190px] items-center justify-center rounded-lg border">
      <div className="flex flex-col items-center gap-3 text-center">
        <DollarSign className="text-muted-foreground size-8" />
        <p className="text-sm font-medium text-slate-600">費用マスタが登録されていません</p>
      </div>
    </Card>
  );
}

export function FeesTab({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const [editingFeeGroup, setEditingFeeGroup] = useState<BrandFeeGroup | null>(null);
  const [disablingFeeGroup, setDisablingFeeGroup] = useState<BrandFeeGroup | null>(null);
  const [deletingFeeGroup, setDeletingFeeGroup] = useState<BrandFeeGroup | null>(null);
  const [disablingFeeGroupContent, setDisablingFeeGroupContent] = useState<BrandFeeGroup | null>(
    null,
  );
  const [deletingFeeGroupContent, setDeletingFeeGroupContent] = useState<BrandFeeGroup | null>(
    null,
  );
  const feesQueryKey = getCrmBrandsByIdFeesQueryKey({ path: { id: brandId } });
  const brandDetailQueryKey = getCrmBrandsByIdQueryKey({ path: { id: brandId } });
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmBrandsByIdFeesOptions({ path: { id: brandId } }),
  });

  const updateFeeGroupMutation = useMutation({
    ...patchCrmBrandsByIdFeesBySubBrandCodeMutation(),
    onSuccess: (response) => {
      toast.success(response.message || '費用設定を保存しました');
      void queryClient.invalidateQueries({ queryKey: feesQueryKey, refetchType: 'all' });
      setEditingFeeGroup(null);
    },
  });

  const disableFeeGroupMutation = useMutation({
    ...patchCrmBrandsByIdFeesBySubBrandCodeDisableMutation(),
    onSuccess: (response) => {
      toast.success(response.message || '費用マスタを無効化しました');
      void queryClient.invalidateQueries({ queryKey: feesQueryKey }).then(() => {
        setDisablingFeeGroup(null);
        setDisablingFeeGroupContent(null);
      });
    },
    onError: () => {
      toast.error('費用マスタの無効化に失敗しました');
    },
  });

  const deleteFeeGroupMutation = useMutation({
    ...deleteCrmBrandsByIdFeesBySubBrandCodeMutation(),
    onSuccess: (response) => {
      toast.success(response.message || '費用マスタを削除しました');
      void queryClient
        .invalidateQueries({ queryKey: feesQueryKey })
        .then(() => queryClient.invalidateQueries({ queryKey: brandDetailQueryKey }))
        .then(() => {
          setDeletingFeeGroup(null);
          setDeletingFeeGroupContent(null);
        });
    },
    onError: () => {
      toast.error('費用マスタの削除に失敗しました');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <ErrorState title="費用データが見つかりません" onRetry={refetch} />;
  }

  const isEmpty = !data || data.fee_groups.length === 0;
  const handleDisableDialogOpen = (feeGroup: BrandFeeGroup) => {
    setDisablingFeeGroupContent(feeGroup);
    setDisablingFeeGroup(feeGroup);
  };

  const handleDeleteDialogOpen = (feeGroup: BrandFeeGroup) => {
    setDeletingFeeGroupContent(feeGroup);
    setDeletingFeeGroup(feeGroup);
  };

  const handleSaveFeeGroup = (
    values: BrandFeeGroupFormValues,
    onError: (message: string) => void,
  ) => {
    if (!editingFeeGroup) {
      onError('費用グループが見つかりません');
      return;
    }

    if (!hasFeeGroupChanges(editingFeeGroup, values)) {
      return;
    }

    updateFeeGroupMutation.mutate(
      {
        path: {
          id: brandId,
          subBrandCode: editingFeeGroup.sub_brand_code,
        },
        body: {
          fee_items: values.feeItems.map((item) => ({
            item_code: item.itemCode,
            item_name: item.itemName.trim(),
            effective_start_date: item.effectiveStartDate,
            current_value_including_tax_yen: item.currentValueIncludingTaxYen,
          })),
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

          onError('費用設定の保存に失敗しました。後で再試行してください。');
        },
      },
    );
  };

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
            disabled={isEmpty}
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
                onEdit={setEditingFeeGroup}
                onDisable={handleDisableDialogOpen}
                onDelete={handleDeleteDialogOpen}
              />
            ))}
          </div>
        )}
      </div>

      <BrandFeeGroupEditSheet
        open={!!editingFeeGroup}
        feeGroup={editingFeeGroup}
        isSubmitting={updateFeeGroupMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setEditingFeeGroup(null);
        }}
        onSave={handleSaveFeeGroup}
      />

      <FeeGroupDisableDialog
        open={!!disablingFeeGroup}
        feeGroup={disablingFeeGroupContent}
        isPending={disableFeeGroupMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !disableFeeGroupMutation.isPending) {
            setDisablingFeeGroup(null);
          }
        }}
        onConfirm={() => {
          if (!disablingFeeGroup) return;
          disableFeeGroupMutation.mutate({
            path: {
              id: brandId,
              subBrandCode: disablingFeeGroup.sub_brand_code,
            },
          });
        }}
      />

      <FeeGroupDeleteDialog
        open={!!deletingFeeGroup}
        feeGroup={deletingFeeGroupContent}
        isPending={deleteFeeGroupMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !deleteFeeGroupMutation.isPending) {
            setDeletingFeeGroup(null);
          }
        }}
        onConfirm={() => {
          if (!deletingFeeGroup) return;
          deleteFeeGroupMutation.mutate({
            path: {
              id: brandId,
              subBrandCode: deletingFeeGroup.sub_brand_code,
            },
          });
        }}
      />
    </>
  );
}
