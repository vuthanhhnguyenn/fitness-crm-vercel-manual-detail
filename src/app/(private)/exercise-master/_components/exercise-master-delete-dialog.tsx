'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { ExerciseMasterListItem } from '@/lib/api/types.gen';

interface ExerciseMasterDeleteDialogProps {
  open: boolean;
  label: string;
  row: ExerciseMasterListItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function ExerciseMasterDeleteDialog({
  open,
  label,
  row,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: ExerciseMasterDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{label}を削除しますか？</DialogTitle>
          <DialogDescription>
            「{row?.name}」（コード: {row?.code}）を論理削除します。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button type="button" variant="destructive" disabled={isSubmitting} onClick={onConfirm}>
            削除する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
