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
  patchCrmTransfersByIdApproveMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { TransferDetail } from '@/lib/api/types.gen';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: TransferDetail;
}

export function TransferApproveDialog({ open, onOpenChange, transfer }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  // Cleared on close rather than in an effect, so reopening always starts from a blank draft
  // without triggering a cascading render.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setComment('');
    onOpenChange(nextOpen);
  }

  const { mutate: approve, isPending } = useMutation({
    ...patchCrmTransfersByIdApproveMutation(),
    onSuccess: () => {
      toast.success('移籍申請を承認しました');
      // Both queries are invalidated so the list count and this screen agree without a manual
      // refresh (SC-002). We deliberately stay on the detail screen rather than redirecting to
      // the list: the operator needs to see the timeline advance and the comment recorded.
      void queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: getCrmTransfersByIdQueryKey({ path: { id: transfer.id } }),
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('承認処理に失敗しました');
      onOpenChange(false);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移籍申請を承認しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {transfer.member_name} さんの {transfer.from_store_name} から {transfer.to_store_name}{' '}
            への移籍を承認します。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            コメント
            <OptionalMark />
          </Label>
          <Textarea
            className="resize-none text-sm"
            placeholder="承認コメントを入力してください（任意）"
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() =>
              approve({
                path: { id: transfer.id },
                body: { comment: comment.trim() || undefined },
              })
            }
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            承認する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
