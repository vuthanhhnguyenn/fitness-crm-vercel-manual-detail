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

import type { GetCrmExercisesByIdResponse } from '@/lib/api/types.gen';

type ExerciseDeleteBlockReason =
  NonNullable<GetCrmExercisesByIdResponse>['exercise']['deleteBlockReason'];

function getDeleteBlockedText(blockReason: ExerciseDeleteBlockReason | null | undefined) {
  if (blockReason === 'public') {
    return '公開中のエクササイズは削除できません。先に非公開に変更してください。';
  }
  return '使用中のため削除できません';
}

interface ExerciseDeleteDialogsProps {
  mode: 'blocked' | 'confirm' | null;
  exerciseName: string;
  blockReason?: ExerciseDeleteBlockReason | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete?: () => void;
}

export function ExerciseDeleteDialogs({
  mode,
  exerciseName,
  blockReason,
  open,
  onOpenChange,
  onConfirmDelete,
}: ExerciseDeleteDialogsProps) {
  if (!mode) return null;

  const blocked = mode === 'blocked';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{blocked ? '削除できません' : '削除確認'}</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked ? getDeleteBlockedText(blockReason) : `「${exerciseName}」を削除しますか？`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {blocked ? (
            <AlertDialogAction onClick={() => onOpenChange(false)}>OK</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onConfirmDelete}
              >
                削除する
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
