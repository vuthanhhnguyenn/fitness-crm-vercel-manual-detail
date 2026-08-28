'use client';

// Interactive: owns the confirmation dialog and drives the cancellation mutation.
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
  getCrmLeavesByIdQueryKey,
  getCrmLeavesQueryKey,
  postCrmLeavesByIdCancelWithdrawalMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLeavesResponse } from '@/lib/api/types.gen';

type LeaveRow = NonNullable<GetCrmLeavesResponse['leaves']>[number];

interface Props {
  /** The row awaiting confirmation, or null when the dialog is closed. */
  target: LeaveRow | null;
  onOpenChange: (open: boolean) => void;
}

export function LeavesCancelDialog({ target, onOpenChange }: Readonly<Props>) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    ...postCrmLeavesByIdCancelWithdrawalMutation(),
    onSuccess: (_data, variables) => {
      const name = target?.member_name ?? '';
      toast.success(
        `${name} の退会申請を取り消しました。会員ステータスを有効（通常）に戻しました。`,
      );
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: getCrmLeavesByIdQueryKey({ path: { id: variables.path.id } }),
      });
    },
    /*
     * FR-052 — a refused cancellation keeps the operator on the list, unchanged: the dialog
     * stays open and no query is invalidated. The server's reason reaches them through the
     * shared MutationCache handler, so no `onError` toast belongs here.
     */
  });

  return (
    <AlertDialog open={target !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>退会取り消しを実行しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {target && (
              <>
                <strong>{target.member_name}</strong>（{target.member_number}
                ）の退会申請を取り消します。
                <br />
                取り消し後、会員ステータスは有効（通常）に戻ります。この操作は記録されます。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={cancelMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              if (!target) return;
              cancelMutation.mutate({ path: { id: target.id }, body: {} });
            }}
          >
            {cancelMutation.isPending ? '処理中...' : '取り消しを実行する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
