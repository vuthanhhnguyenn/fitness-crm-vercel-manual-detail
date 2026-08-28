'use client';

import { useEffect } from 'react';

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

import type { TrainingEquipmentDetail } from '@/lib/api/types.gen';

import { useSubmitGuard } from '../../_hooks/use-submit-guard.hook';

type TrainingEquipmentDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: TrainingEquipmentDetail;
  isSubmitting?: boolean;
  /** Lets the double-submit guard reopen so a failed delete can be retried. */
  isSubmitError?: boolean;
  onConfirm: () => void;
};

/** FR-006: equipment that still has exercise links cannot be deleted. */
export function TrainingEquipmentDeleteDialog({
  open,
  onOpenChange,
  equipment,
  isSubmitting = false,
  isSubmitError = false,
  onConfirm,
}: TrainingEquipmentDeleteDialogProps) {
  const hasLinkedExercises = equipment.linkedExercises.length > 0;
  const { submitOnce, resetSubmitGuard } = useSubmitGuard(isSubmitting, isSubmitError);

  // Reopening the dialog is a new attempt, so the guard must not stay closed from the previous one.
  useEffect(() => {
    if (open) resetSubmitGuard();
  }, [open, resetSubmitGuard]);

  if (hasLinkedExercises) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除できません</AlertDialogTitle>
            <AlertDialogDescription>
              この機材はエクササイズに紐づいているため削除できません。先に「エクササイズ紐づけ」タブからエクササイズ側の機材紐づけを解除してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>閉じる</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>機材を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{equipment.name} ({equipment.id}
            )」を削除します。削除後は一覧から非表示になります。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isSubmitting}
            // Guarded: the losing requests of a rapid double click fail and toast 「削除に失敗しました」
            // over an otherwise successful delete.
            onClick={() => submitOnce(onConfirm)}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
