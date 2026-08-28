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

import type { CampaignListItemResponse } from '@/lib/api/types.gen';

type CampaignDeleteDialogProps = {
  campaign: CampaignListItemResponse | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function CampaignDeleteDialog({
  campaign,
  onOpenChange,
  onConfirm,
  isPending,
}: Readonly<CampaignDeleteDialogProps>) {
  return (
    <AlertDialog open={campaign !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このキャンペーンを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{campaign?.name}
            」を削除します。適用中の会員または申請があるキャンペーンは削除できません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
