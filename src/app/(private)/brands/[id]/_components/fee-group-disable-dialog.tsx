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

interface FeeGroupDisableDialogProps {
  open: boolean;
  feeGroup: BrandFeeGroup | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function FeeGroupDisableDialog({
  open,
  feeGroup,
  isPending,
  onOpenChange,
  onConfirm,
}: FeeGroupDisableDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        className="max-w-[392px] gap-0 overflow-hidden p-0 sm:max-w-[392px]"
      >
        <AlertDialogHeader className="place-items-start gap-2 px-4 py-4 text-left">
          <AlertDialogTitle className="text-[15px] leading-6 font-semibold">
            費用マスタを無効にしますか？
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7">
            {feeGroup
              ? `「${feeGroup.parent_brand_name} / ${feeGroup.display_name}」の費用マスタを無効にします。有効開始日以降の新規入会時に適用されなくなります。`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mb-0 justify-end gap-2 px-4 pt-4 pb-5 sm:flex-row sm:justify-end">
          <AlertDialogCancel disabled={isPending} className="h-8 rounded-md px-4 text-sm">
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-foreground text-background hover:bg-foreground/90 h-8 rounded-md px-4 text-sm"
            disabled={isPending || !feeGroup}
            onClick={onConfirm}
          >
            無効にする
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
