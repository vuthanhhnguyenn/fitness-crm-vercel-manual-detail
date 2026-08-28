'use client';
import { useState } from 'react';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  postCrmMembersByIdWithdrawCancelMutation,
} from '@/lib/api/@tanstack/react-query.gen';

interface WithdrawCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
}

export function WithdrawCancelDialog({
  open,
  onOpenChange,
  memberId,
}: Readonly<WithdrawCancelDialogProps>) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { mutate, isPending } = useMutation({
    ...postCrmMembersByIdWithdrawCancelMutation(),
    onSuccess: () => {
      toast.success('退会を取り消しました', { description: 'ステータスを「有効」に戻しました' });
      handleClose();
      void queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      void queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
    },
    onError: () => {
      toast.error('退会取り消しに失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setComment(''), 300);
  };

  const handleConfirm = () => {
    mutate({ path: { id: memberId }, body: { comment: comment.trim() || undefined } });
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>退会を取り消しますか？</AlertDialogTitle>
          <AlertDialogDescription>会員ステータスを「有効」に戻します。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 px-1 pb-2">
          <Label htmlFor="withdraw-cancel-comment" className="text-sm font-medium">
            取り消し事由 <span className="text-muted-foreground ml-1 text-xs">任意</span>
          </Label>
          <Textarea
            id="withdraw-cancel-comment"
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            placeholder="例：会員から継続の申し出があったため"
            className="resize-none text-sm"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isPending}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
            取り消す
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
