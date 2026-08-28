'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { getCrmMembersByIdContractsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';

type LockerContractUnpaidAlertProps = {
  memberId?: string;
};

export function LockerContractUnpaidAlert({ memberId }: LockerContractUnpaidAlertProps) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...getCrmMembersByIdContractsSummaryOptions({ path: { id: memberId ?? '' } }),
    enabled: Boolean(memberId),
  });

  if (!memberId || isLoading) return null;

  /**
   * FR-005: an unreachable summary means the unpaid balance is *unknown*, never "0円".
   * Claiming 契約可能 here would let staff reassign a slot for a member who may still owe
   * money, so the unknown state gets its own warning and the edit page blocks saving.
   */
  if (isError || !data) {
    return (
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="text-warning size-4" />
        <AlertDescription className="text-warning text-xs">
          未納金の確認ができませんでした。安全のため、スロットの変更は保存できません。
          <button
            type="button"
            className="text-warning ml-1 underline underline-offset-4 disabled:opacity-60"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            再試行
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  const unpaidAmount = data.unpaidAmount;
  const hasUnpaidBalance = unpaidAmount > 0;

  if (hasUnpaidBalance) {
    return (
      <Alert className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="text-destructive size-4" />
        <AlertDescription className="text-destructive text-xs">
          未納金あり: ¥{unpaidAmount.toLocaleString()}（契約不可）—
          未納金が残っている会員はロッカー契約を締結できません。先に未納金を解消してください。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-success/50 bg-success/10">
      <CheckCircle2 className="text-success size-4" />
      <AlertDescription className="text-success text-xs">未納金: 0円（契約可能）</AlertDescription>
    </Alert>
  );
}
