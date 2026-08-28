'use client';

import { useState } from 'react';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { Loader2 } from 'lucide-react';

import { OptionalMark } from '@/components/common/field-marker';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TransferBulkApproveDialogProps {
  open: boolean;
  selectedCount: number;
  isPending: boolean;
  onConfirm: (comment: string | undefined) => void;
  onOpenChange: (open: boolean) => void;
}

export function TransferBulkApproveDialog({
  open,
  selectedCount,
  isPending,
  onConfirm,
  onOpenChange,
}: Readonly<TransferBulkApproveDialogProps>) {
  const [comment, setComment] = useState('');

  // Cleared here rather than in an effect: the close event is what should reset the draft, and
  // resetting during render would cascade an extra render on every open/close.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setComment('');
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{selectedCount}件のJOYFIT自動移籍を承認しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            承認後、即時に主契約締結店舗が移籍先に更新されます。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            コメント
            <OptionalMark />
          </Label>
          <Textarea
            className="resize-none text-sm"
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            placeholder="承認コメントを入力してください（任意）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => onConfirm(comment.trim() || undefined)}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            承認する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
