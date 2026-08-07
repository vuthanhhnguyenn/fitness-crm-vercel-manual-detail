'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { getCrmMembersByIdContractsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';

type LockerContractUnpaidAlertProps = {
  memberId?: string;
};

export function LockerContractUnpaidAlert({ memberId }: LockerContractUnpaidAlertProps) {
  const { data, isLoading } = useQuery({
    ...getCrmMembersByIdContractsSummaryOptions({ path: { id: memberId ?? '' } }),
    enabled: Boolean(memberId),
  });

  if (!memberId || isLoading) return null;

  const unpaidAmount = data?.unpaid_amount ?? 0;
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
