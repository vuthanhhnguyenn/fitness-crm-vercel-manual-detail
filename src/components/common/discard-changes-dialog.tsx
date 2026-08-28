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

interface DiscardChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Pairs with `useUnsavedChanges`: confirms leaving a form that still has unsaved edits. */
export function DiscardChangesDialog({
  open,
  onOpenChange,
  onCancel,
  onConfirm,
}: DiscardChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            未保存の変更はすべて失われます。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>編集を続ける</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>破棄する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
