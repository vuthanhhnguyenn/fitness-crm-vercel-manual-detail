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

import { BannerItemResponse } from '@/lib/api/types.gen';

interface BannerDeleteDialogProps {
  banner: BannerItemResponse | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function BannerDeleteDialog({
  banner,
  onOpenChange,
  onConfirm,
  isPending,
}: BannerDeleteDialogProps) {
  return (
    <AlertDialog open={banner !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>バナーを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{banner?.title}
            」を削除します。この操作は取り消せません。WEBサイト・モバイルアプリから即時に非表示になります。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? '削除中...' : '削除する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
