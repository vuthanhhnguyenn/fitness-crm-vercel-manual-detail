import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface RefundPendingBannerProps {
  pendingCount: number;
  pendingAmount: number;
}

/** FR-014: banner showing the count and combined amount of currently pending refund requests. */
export function RefundPendingBanner({
  pendingCount,
  pendingAmount,
}: Readonly<RefundPendingBannerProps>) {
  if (pendingCount === 0) return null;

  return (
    <Alert className="bg-warning/10 border-warning/20 text-warning">
      <AlertTriangle className="size-4" />
      <AlertDescription className="text-sm font-medium">
        承認待ちの返金申請が <span className="font-bold tabular-nums">{pendingCount}件</span>（合計{' '}
        <span className="tabular-nums">¥{pendingAmount.toLocaleString('ja-JP')}</span>）あります
      </AlertDescription>
    </Alert>
  );
}
