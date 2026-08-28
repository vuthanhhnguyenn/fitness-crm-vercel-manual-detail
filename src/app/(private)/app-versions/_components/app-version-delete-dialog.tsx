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

import type { AppVersionRecord } from '@/lib/api/types.gen';

import { APP_VERSION_BRAND_LABELS } from '../_constants/app-version.constants';

interface AppVersionDeleteDialogProps {
  item: AppVersionRecord | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function AppVersionDeleteDialog({
  item,
  onOpenChange,
  onConfirm,
  isPending,
}: AppVersionDeleteDialogProps) {
  return (
    <AlertDialog open={item !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このアプリバージョンを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {item
              ? `${APP_VERSION_BRAND_LABELS[item.brandEnum]} v${item.iosVersionName}/${item.androidVersionName} のバージョン情報を削除します。`
              : 'このバージョン情報を削除します。'}
            この操作は取り消せません。
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
