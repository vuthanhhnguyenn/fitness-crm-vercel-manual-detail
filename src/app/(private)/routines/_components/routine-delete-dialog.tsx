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

type RoutineDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineName: string;
  /** 公開中は削除不可。true の場合は削除アクションを出さず、ガイダンスのみ表示 */
  isPublished: boolean;
  isSubmitting?: boolean;
  onConfirm: () => void;
};

export function RoutineDeleteDialog({
  open,
  onOpenChange,
  routineName,
  isPublished,
  isSubmitting,
  onConfirm,
}: RoutineDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPublished ? 'このルーティンは削除できません' : '削除しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPublished
              ? `「${routineName}」は公開中のため削除できません。先にステータスを「非公開」に変更してから削除してください。`
              : `「${routineName}」を削除します。この操作は元に戻せません。`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>閉じる</AlertDialogCancel>
          {!isPublished && (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
            >
              {isSubmitting ? '削除中...' : '削除する'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
