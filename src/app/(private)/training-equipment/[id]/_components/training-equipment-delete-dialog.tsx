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

import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

type TrainingEquipmentDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: TrainingEquipmentItem;
  isSubmitting?: boolean;
  onConfirm: () => void;
};

export function TrainingEquipmentDeleteDialog({
  open,
  onOpenChange,
  equipment,
  isSubmitting = false,
  onConfirm,
}: TrainingEquipmentDeleteDialogProps) {
  const hasLinkedExercises = equipment.linked_exercise_count > 0;

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
            onClick={onConfirm}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
