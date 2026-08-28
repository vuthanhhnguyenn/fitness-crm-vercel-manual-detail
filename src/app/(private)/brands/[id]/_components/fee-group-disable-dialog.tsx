'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  getCrmBrandsByIdChangeHistoryQueryKey,
  getCrmBrandsByIdFeesQueryKey,
  getCrmBrandsByIdQueryKey,
  patchCrmBrandsByIdFeesBySubBrandCodeDisableMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import type { BrandFeeGroup } from '../_types/brand-fee.type';

interface FeeGroupDisableDialogProps {
  brandId: string;
  feeGroup: BrandFeeGroup | null;
  onOpenChange: (open: boolean) => void;
}

export function FeeGroupDisableDialog({
  brandId,
  feeGroup,
  onOpenChange,
}: FeeGroupDisableDialogProps) {
  const queryClient = useQueryClient();

  const disableFeeGroupMutation = useMutation({
    ...patchCrmBrandsByIdFeesBySubBrandCodeDisableMutation(),
    onSuccess: (response) => {
      toast.success(response.message || '費用マスタを無効化しました');
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdFeesQueryKey({ path: { id: brandId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdQueryKey({ path: { id: brandId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdChangeHistoryQueryKey({ path: { id: brandId } }),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('費用マスタの無効化に失敗しました');
    },
  });

  // Keep showing the last fee group's details while the dialog animates closed.
  const [prevFeeGroup, setPrevFeeGroup] = useState(feeGroup);
  const [displayFeeGroup, setDisplayFeeGroup] = useState<BrandFeeGroup | null>(feeGroup);
  if (feeGroup !== prevFeeGroup) {
    setPrevFeeGroup(feeGroup);
    if (feeGroup) {
      setDisplayFeeGroup(feeGroup);
    }
  }

  const handleConfirm = () => {
    if (!feeGroup) return;
    disableFeeGroupMutation.mutate({
      path: { id: brandId, subBrandCode: feeGroup.sub_brand_code },
    });
  };

  return (
    <AlertDialog
      open={!!feeGroup}
      onOpenChange={(open) => {
        if (!disableFeeGroupMutation.isPending) onOpenChange(open);
      }}
    >
      <AlertDialogContent
        size="default"
        className="max-w-[392px] gap-0 overflow-hidden p-0 sm:max-w-[392px]"
      >
        <AlertDialogHeader className="place-items-start gap-2 px-4 py-4 text-left">
          <AlertDialogTitle className="text-[15px] leading-6 font-semibold">
            費用マスタを無効にしますか？
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7">
            {displayFeeGroup
              ? `「${displayFeeGroup.parent_brand_name} / ${displayFeeGroup.display_name}」の費用マスタを無効にします。有効開始日以降の新規入会時に適用されなくなります。`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mb-0 justify-end gap-2 px-4 pt-4 pb-5 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            disabled={disableFeeGroupMutation.isPending}
            className="h-8 rounded-md px-4 text-sm"
          >
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-foreground text-background hover:bg-foreground/90 h-8 rounded-md px-4 text-sm"
            disabled={disableFeeGroupMutation.isPending || !feeGroup}
            onClick={handleConfirm}
          >
            無効にする
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
