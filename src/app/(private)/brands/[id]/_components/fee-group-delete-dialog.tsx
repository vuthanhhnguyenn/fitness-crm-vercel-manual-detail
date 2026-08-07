'use client';

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

import type { GetCrmBrandsByIdFeesResponse } from '@/lib/api/types.gen';

type BrandFeeGroup = GetCrmBrandsByIdFeesResponse['fee_groups'][number];

interface FeeGroupDeleteDialogProps {
  open: boolean;
  feeGroup: BrandFeeGroup | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function FeeGroupDeleteDialog({
  open,
  feeGroup,
  isPending,
  onOpenChange,
  onConfirm,
}: FeeGroupDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        className="max-w-[392px] gap-0 overflow-hidden p-0 sm:max-w-[392px]"
      >
        <AlertDialogHeader className="place-items-start gap-2 px-4 py-4 text-left">
          <AlertDialogTitle className="text-[15px] leading-6 font-semibold">
            費用マスタを削除しますか？
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7">
            {feeGroup
              ? `「${feeGroup.parent_brand_name} / ${feeGroup.display_name}」（${feeGroup.fee_master_id}）の費用マスタを削除します。この操作は取り消せません。`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mb-0 justify-end gap-2 px-4 pt-4 pb-5 sm:flex-row sm:justify-end">
          <AlertDialogCancel disabled={isPending} className="h-8 rounded-md px-4 text-sm">
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 h-8 rounded-md px-4 text-sm text-white"
            disabled={isPending || !feeGroup}
            onClick={onConfirm}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
