'use client';

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

import {
  getCrmMembersByIdQueryKey,
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

  const { mutate, isPending } = useMutation({
    ...postCrmMembersByIdWithdrawCancelMutation(),
    onSuccess: () => {
      toast.success('退会を取り消しました', { description: 'ステータスを「有効」に戻しました' });
      onOpenChange(false);
      void queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
    },
    onError: () => {
      toast.error('退会取り消しに失敗しました');
    },
  });

  const handleConfirm = () => {
    mutate({ path: { id: memberId } });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>退会を取り消しますか？</AlertDialogTitle>
          <AlertDialogDescription>会員ステータスを「有効」に戻します。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
            取り消す
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
