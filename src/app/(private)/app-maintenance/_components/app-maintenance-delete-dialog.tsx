'use client';

import { format } from 'date-fns';

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

import { AppMaintenanceItemResponse } from '@/lib/api/types.gen';

import { APP_MAINTENANCE_BRAND_LABELS } from '../_constants/app-maintenance.constants';

interface AppMaintenanceDeleteDialogProps {
  target: AppMaintenanceItemResponse | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function AppMaintenanceDeleteDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: AppMaintenanceDeleteDialogProps) {
  const startsAtLabel = target ? format(new Date(target.startsAt), 'yyyy/MM/dd HH:mm') : '';

  return (
    <AlertDialog open={target !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このアプリメンテナンス情報を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {target && APP_MAINTENANCE_BRAND_LABELS[target.targetBrand]} のメンテナンス情報（
            {startsAtLabel} 〜）を削除します。この操作は取り消せません。
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
