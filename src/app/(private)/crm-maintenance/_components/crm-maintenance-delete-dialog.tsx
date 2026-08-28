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

export interface CrmMaintenanceDeleteTarget {
  id: string;
  title: string;
}

interface CrmMaintenanceDeleteDialogProps {
  target: CrmMaintenanceDeleteTarget | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function CrmMaintenanceDeleteDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: CrmMaintenanceDeleteDialogProps) {
  return (
    <AlertDialog open={target !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このCRMメンテナンス情報を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{target?.title}」を削除します。紐づく許可ユーザーリストも削除されます。
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
