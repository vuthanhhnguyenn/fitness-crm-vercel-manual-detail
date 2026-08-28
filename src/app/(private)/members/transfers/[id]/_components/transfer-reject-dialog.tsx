'use client';

import { useState } from 'react';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

import {
  getCrmTransfersByIdQueryKey,
  getCrmTransfersQueryKey,
  patchCrmTransfersByIdRejectMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { TransferDetail } from '@/lib/api/types.gen';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: TransferDetail;
}

export function TransferRejectDialog({ open, onOpenChange, transfer }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  // Cleared on close rather than in an effect, so reopening always starts from a blank draft
  // without triggering a cascading render.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setComment('');
    onOpenChange(nextOpen);
  }

  const { mutate: reject, isPending } = useMutation({
    ...patchCrmTransfersByIdRejectMutation(),
    onSuccess: () => {
      toast.success('移籍申請を却下しました');
      void queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: getCrmTransfersByIdQueryKey({ path: { id: transfer.id } }),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('却下処理に失敗しました');
      onOpenChange(false);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移籍申請を却下しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {transfer.member_name} さんの移籍申請を却下します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            コメント
            <OptionalMark />
          </Label>
          <Textarea
            className="resize-none text-sm"
            placeholder="却下理由を入力してください（任意）"
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={() =>
              reject({
                path: { id: transfer.id },
                body: { comment: comment.trim() || undefined },
              })
            }
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            却下する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
