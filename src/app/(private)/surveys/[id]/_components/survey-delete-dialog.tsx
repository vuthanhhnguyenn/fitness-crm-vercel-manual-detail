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

interface SurveyDeleteDialogProps {
  surveyName: string;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function SurveyDeleteDialog({
  surveyName,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: SurveyDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>アンケートを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium">{surveyName}</span>
            を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
