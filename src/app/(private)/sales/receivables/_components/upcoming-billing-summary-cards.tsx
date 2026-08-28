import { SummaryCard } from '@/components/common/summary-card';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { UpcomingBillingSummary } from '@/lib/api/types.gen';

function nextBillingMonthLabel(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}年${next.getMonth() + 1}月分`;
}

function formatYen(amount: number): string {
  return amount.toLocaleString('ja-JP');
}

interface UpcomingBillingSummaryCardsProps {
  summary: UpcomingBillingSummary | undefined;
  isLoading: boolean;
}

export function UpcomingBillingSummaryCards({
  summary,
  isLoading,
}: Readonly<UpcomingBillingSummaryCardsProps>) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="gap-0 py-4">
            <CardContent className="px-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-7 w-20" />
              <Skeleton className="mt-1 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <SummaryCard
        title="請求予定総額"
        value={formatYen(summary.total_amount)}
        prefix="¥"
        subValue={nextBillingMonthLabel()}
      />
      <SummaryCard title="請求予定件数" value={`${summary.total_count}`} suffix="件" />
      <SummaryCard
        title="SBPS請求予定"
        value={formatYen(summary.sbps_amount)}
        prefix="¥"
        subValue={`${summary.sbps_count}件`}
      />
      <SummaryCard
        title="JACCS請求予定"
        value={formatYen(summary.jaccs_amount)}
        prefix="¥"
        subValue={`${summary.jaccs_count}件`}
      />
    </div>
  );
}
