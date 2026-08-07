'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { StatusCard } from '@/components/common/status-card';
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
import { Button } from '@/components/ui/button';

import {
  getCrmLeavesByIdQueryKey,
  getCrmLeavesQueryKey,
  postCrmLeavesByIdApproveMutation,
  postCrmLeavesByIdCancelWithdrawalMutation,
  postCrmLeavesByIdExecuteWithdrawalMutation,
  postCrmLeavesByIdRejectMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { LeaveStatus } from '@/lib/api/types.gen';
import type { GetCrmLeavesByIdResponse } from '@/lib/api/types.gen';

import { LEAVE_TYPE_LABELS, STATUS_ICON_CONFIG } from '../../_constants/constants';

type LeaveDetail = NonNullable<GetCrmLeavesByIdResponse>['leave'];

interface Props {
  leave: LeaveDetail;
}

export function LeaveStatusAction({ leave }: Readonly<Props>) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelWithdrawalOpen, setCancelWithdrawalOpen] = useState(false);
  const [executeWithdrawalOpen, setExecuteWithdrawalOpen] = useState(false);

  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: getCrmLeavesByIdQueryKey({ path: { id: leave.id } }),
    });
    void queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey() });
  };

  const approveMutation = useMutation({
    ...postCrmLeavesByIdApproveMutation(),
    onSuccess: () => {
      toast.success('申請を承認しました');
      setApproveOpen(false);
      invalidate();
    },
    onError: () => toast.error('承認に失敗しました'),
  });

  const rejectMutation = useMutation({
    ...postCrmLeavesByIdRejectMutation(),
    onSuccess: () => {
      toast.success('申請を却下しました');
      setRejectOpen(false);
      invalidate();
    },
    onError: () => toast.error('却下に失敗しました'),
  });

  const cancelMutation = useMutation({
    ...postCrmLeavesByIdCancelWithdrawalMutation(),
    onSuccess: () => {
      toast.success('退会を取り消しました');
      setCancelWithdrawalOpen(false);
      invalidate();
    },
    onError: () => toast.error('退会取り消しに失敗しました'),
  });

  const executeWithdrawalMutation = useMutation({
    ...postCrmLeavesByIdExecuteWithdrawalMutation(),
    onSuccess: () => {
      toast.success('退会処理を実行しました');
      setExecuteWithdrawalOpen(false);
      invalidate();
    },
    onError: () => toast.error('退会処理の実行に失敗しました'),
  });

  const isAnyLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending ||
    executeWithdrawalMutation.isPending;

  const statusConfig = STATUS_ICON_CONFIG[leave.status];

  const isPending =
    leave.status === LeaveStatus.SUSPENSION_SCHEDULED ||
    leave.status === LeaveStatus.WITHDRAWAL_SCHEDULED;
  const isWithdrawalPending = leave.status === LeaveStatus.WITHDRAWAL_PENDING;
  const isWithdrawalScheduled = leave.status === LeaveStatus.WITHDRAWAL_SCHEDULED;
  const isCompleted = leave.status === LeaveStatus.COMPLETED;

  const hasAction = isPending || isWithdrawalPending || isWithdrawalScheduled || isCompleted;

  return (
    <>
      <div className="sticky top-6 flex flex-col gap-4">
        <StatusCard
          tone={statusConfig.tone}
          icon={statusConfig.icon}
          label={statusConfig.label}
          meta={[`最終更新: ${leave.updated_at}`]}
          action={
            hasAction && (
              <div className="flex w-full flex-col gap-2">
                {isPending && (
                  <>
                    <Button
                      className="w-full"
                      disabled={isAnyLoading}
                      onClick={() => setApproveOpen(true)}
                    >
                      承認
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 w-full"
                      disabled={isAnyLoading}
                      onClick={() => setRejectOpen(true)}
                    >
                      却下
                    </Button>
                  </>
                )}
                {isWithdrawalScheduled && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isAnyLoading}
                    onClick={() => setCancelWithdrawalOpen(true)}
                  >
                    退会取り消し
                  </Button>
                )}
                {isWithdrawalPending && (
                  <Button
                    className="w-full"
                    disabled={isAnyLoading}
                    onClick={() => setExecuteWithdrawalOpen(true)}
                  >
                    退会処理を実行
                  </Button>
                )}
                {isCompleted && (
                  <p className="text-muted-foreground py-2 text-center text-xs">
                    処理が完了しています
                  </p>
                )}
              </div>
            )
          }
        />
      </div>

      {/* 承認 AlertDialog */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>申請を承認しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {leave.member_name} さんの{LEAVE_TYPE_LABELS[leave.type]}申請を承認します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              disabled={approveMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                approveMutation.mutate({ path: { id: leave.id }, body: {} });
              }}
            >
              {approveMutation.isPending ? '処理中...' : '承認する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 却下 AlertDialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>申請を却下しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {leave.member_name} さんの{LEAVE_TYPE_LABELS[leave.type]}申請を却下します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                rejectMutation.mutate({ path: { id: leave.id }, body: { reason: '却下' } });
              }}
            >
              {rejectMutation.isPending ? '処理中...' : '却下する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 退会取り消し AlertDialog */}
      <AlertDialog open={cancelWithdrawalOpen} onOpenChange={setCancelWithdrawalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>退会を取り消しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {leave.member_name} さんの退会予定を取り消します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                cancelMutation.mutate({ path: { id: leave.id }, body: {} });
              }}
            >
              {cancelMutation.isPending ? '処理中...' : '取り消す'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 退会処理実行 AlertDialog */}
      <AlertDialog open={executeWithdrawalOpen} onOpenChange={setExecuteWithdrawalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>退会処理を実行しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {leave.member_name} さんの退会処理を手動で実行します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executeWithdrawalMutation.isPending}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={executeWithdrawalMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                executeWithdrawalMutation.mutate({ path: { id: leave.id }, body: {} });
              }}
            >
              {executeWithdrawalMutation.isPending ? '処理中...' : '実行する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
