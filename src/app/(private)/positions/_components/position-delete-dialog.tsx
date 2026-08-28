'use client';

// Client component: confirmation dialog state driven by the list page
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

import type { PositionListItem } from '@/lib/api/types.gen';

type PositionDeleteDialogProps = {
  position: PositionListItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

/** 職位削除の確認ダイアログ (FR-014 / PAR030) */
export function PositionDeleteDialog({
  position,
  onOpenChange,
  onConfirm,
  isPending,
}: PositionDeleteDialogProps) {
  return (
    <AlertDialog open={position !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>職位を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{position?.position_name}」を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={onConfirm}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
