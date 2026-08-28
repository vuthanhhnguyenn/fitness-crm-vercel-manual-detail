'use client';

// Client component: owns the approve/reject decision mutation (single + bulk) so callers
// only need to open the dialog with an action and react to success.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
  getCrmBillingRecordsRefundRequestsQueryKey,
  postCrmBillingRecordsRefundRequestsBulkDecisionMutation,
  postCrmBillingRecordsRefundRequestsByIdDecisionMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { RefundQueueEntry } from '@/lib/api/types.gen';

import { formatYen } from './refund-queue-table';

export type RefundConfirmAction =
  | { kind: 'single'; decision: 'approve' | 'reject'; entry: RefundQueueEntry }
  | {
      kind: 'bulk';
      decision: 'approve' | 'reject';
      approvableIds: string[];
      excludedCount: number;
    };

interface RefundDecisionDialogProps {
  action: RefundConfirmAction | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * FR-019: explicit confirmation step required before finalizing any single or bulk
 * approve/reject decision. On approve, states that execution is immediate with
 * payment-method-specific guidance (FR-017).
 */
export function RefundDecisionDialog({
  action,
  onOpenChange,
  onSuccess,
}: Readonly<RefundDecisionDialogProps>) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getCrmBillingRecordsRefundRequestsQueryKey() });
  };

  const singleDecisionMutation = useMutation({
    ...postCrmBillingRecordsRefundRequestsByIdDecisionMutation(),
    onSuccess: (result, variables) => {
      invalidate();
      const label = variables.body?.decision === 'approve' ? '承認し、返金を実行' : '否認';
      toast.success(`返金申請 #${result.refund_id} を${label}しました`);
      onSuccess();
    },
    onError: () => {
      toast.error('返金申請の決定に失敗しました');
    },
  });

  const bulkDecisionMutation = useMutation({
    ...postCrmBillingRecordsRefundRequestsBulkDecisionMutation(),
    onSuccess: (result, variables) => {
      invalidate();
      const label = variables.body?.decision === 'approve' ? '承認し、返金を実行' : '否認';
      const excludedCount =
        action?.kind === 'bulk' ? action.excludedCount : result.excluded_ids.length;
      toast.success(
        `${result.decided_ids.length}件の返金申請を${label}しました${
          excludedCount > 0 ? `（${excludedCount}件は権限外のため除外）` : ''
        }`,
      );
      onSuccess();
    },
    onError: () => {
      toast.error('一括決定に失敗しました');
    },
  });

  const isPending = singleDecisionMutation.isPending || bulkDecisionMutation.isPending;

  function handleConfirm() {
    if (!action) return;
    if (action.kind === 'single') {
      singleDecisionMutation.mutate({
        path: { id: action.entry.refund_id },
        body: { decision: action.decision },
      });
      return;
    }
    bulkDecisionMutation.mutate({
      body: { ids: action.approvableIds, decision: action.decision },
    });
  }

  const decisionLabel = action?.decision === 'approve' ? '承認' : '否認';

  return (
    <AlertDialog open={!!action} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>返金申請を{decisionLabel}しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {action?.kind === 'bulk'
              ? `選択中の返金申請 ${action.approvableIds.length}件を一括${decisionLabel}します${
                  action.excludedCount > 0
                    ? `（${action.excludedCount}件は権限外のため除外されます）`
                    : ''
                }。`
              : action
                ? `返金申請 #${action.entry.refund_id}（${action.entry.member_name} / ${formatYen(action.entry.refund_amount)}）を${decisionLabel}します。`
                : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {action?.decision === 'approve' && (
          <Alert className="bg-info/10 border-info/20">
            <Info className="text-info size-4" />
            <AlertDescription className="text-info text-xs">
              {action.kind === 'single'
                ? action.entry.payment_method === 'sbps'
                  ? '承認と同時に即時返金を実行します。SBPS取消処理（決済日から90日以内）が実行されます。'
                  : '承認と同時に即時返金を実行します。JACCS決済のため手動返金またはCASHPOSTで対応が必要です。'
                : '承認と同時に即時返金を実行します（SBPS＝取消処理・90日以内／JACCS＝手動返金またはCASHPOST）。'}
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
            {decisionLabel}する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
