'use client';

// Interactive: owns dialog state and drives the cancellation mutation.
import { useState } from 'react';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
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

import {
  getCrmLeavesByIdQueryKey,
  getCrmLeavesQueryKey,
  postCrmLeavesByIdCancelWithdrawalMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLeavesByIdResponse } from '@/lib/api/types.gen';
import { CancellationBlockedReason, LeaveStatus } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { STATUS_ICON_CONFIG } from '../../_constants/constants';

type LeaveDetail = NonNullable<GetCrmLeavesByIdResponse>['leave'];

interface Props {
  leave: LeaveDetail;
}

export function LeaveStatusAction({ leave }: Readonly<Props>) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    ...postCrmLeavesByIdCancelWithdrawalMutation(),
    onSuccess: () => {
      toast.success(
        `${leave.member.name} の退会申請を取り消しました。会員ステータスを有効（通常）に戻しました。`,
      );
      setCancelOpen(false);
      void queryClient.invalidateQueries({
        queryKey: getCrmLeavesByIdQueryKey({ path: { id: leave.id } }),
      });
      void queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey() });
    },
    /*
     * FR-082a — a failure keeps the operator on this view with the application unchanged,
     * and the server's message reaches them through the shared MutationCache handler. An
     * `onError` toast here would only duplicate it.
     */
  });

  const statusConfig = STATUS_ICON_CONFIG[leave.status];

  const isWithdrawalScheduled = leave.status === LeaveStatus.WITHDRAWAL_SCHEDULED;
  const isCompleted = leave.status === LeaveStatus.COMPLETED;
  const isCancelled = leave.status === LeaveStatus.CANCELLED;

  // FR-077 — an action area exists only for these closing states.
  const hasAction = isWithdrawalScheduled || isCompleted || isCancelled;

  /**
   * FR-078 — the button explains itself in both directions: `denyTooltip` covers the
   * missing permission, `blockedTooltip` the server's date restriction. They are separate
   * props because `RoleGatedButton` only renders `denyTooltip` on the role-denied branch;
   * an operator who *has* the permission but faces a non-cancellable application would
   * otherwise get a greyed-out button with no reason. Cancellability is server-derived —
   * never recomputed from dates here.
   */
  const denyTooltip = '退会取り消しの権限がありません';
  const blockedTooltip = leave.cancellable
    ? undefined
    : leave.cancellation_blocked_reason === CancellationBlockedReason.USAGE_STARTED
      ? '利用開始日以降のため取り消し不可'
      : '退会処理が開始されているため取り消し不可';

  return (
    <>
      <div className="sticky top-0 flex flex-col gap-4">
        <StatusCard
          tone={statusConfig.tone}
          icon={statusConfig.icon}
          label={statusConfig.label}
          meta={[`最終更新: ${formatDateYYYYMMDD_HHMM(leave.updated_at)}`]}
          action={
            hasAction && (
              <div className="flex w-full flex-col gap-2">
                {/* Cancelling a scheduled withdrawal is gated by A-03 権限マトリクス / FR-006. */}
                {isWithdrawalScheduled && (
                  <RoleGatedButton
                    requiredPermission={Permission.MembersWithdraw}
                    denyTooltip={denyTooltip}
                    tooltip={blockedTooltip}
                    variant="outline"
                    className="w-full"
                    disabled={!leave.cancellable || cancelMutation.isPending}
                    onClick={() => setCancelOpen(true)}
                  >
                    退会取り消し
                  </RoleGatedButton>
                )}
                {isCompleted && (
                  <p className="text-muted-foreground py-2 text-center text-xs">
                    処理が完了しています
                  </p>
                )}
                {/* FR-002 — a cancelled application shows who cancelled it and when. */}
                {isCancelled && (
                  <div className="text-muted-foreground flex flex-col gap-0.5 py-2 text-center text-xs">
                    <p>退会申請は取り消されています</p>
                    {leave.cancelled_at && (
                      <p>実行日時: {formatDateYYYYMMDD_HHMM(leave.cancelled_at)}</p>
                    )}
                    {leave.cancelled_by && <p>実行者: {leave.cancelled_by}</p>}
                  </div>
                )}
              </div>
            )
          }
        />
      </div>

      {/* FR-080 — this screen keeps its own V0 wording; the list dialog keeps its own (Q-08). */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>退会を取り消しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {leave.member.name} さんの退会予定を取り消します。
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
    </>
  );
}
