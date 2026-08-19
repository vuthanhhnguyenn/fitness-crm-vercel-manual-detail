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

interface ManualNotificationDiscardDialogProps {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function ManualNotificationDiscardDialog({
  open,
  onCancel,
  onConfirm,
}: ManualNotificationDiscardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            未保存の変更はすべて失われます。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>編集を続ける</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>破棄する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
