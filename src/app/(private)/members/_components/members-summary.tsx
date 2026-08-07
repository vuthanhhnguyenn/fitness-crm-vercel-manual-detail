import { formatYen } from '@/utils/format.util';
import { AlertCircle, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import type { GetCrmMembersSummaryResponse } from '@/lib/api/types.gen';

export default function SummaryMembers({
  summary,
}: {
  summary: GetCrmMembersSummaryResponse | undefined;
}) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card className="border py-4">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-xs">在籍会員数</p>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-2xl font-semibold">{summary.active_count.toLocaleString()}</span>
            <span className="text-muted-foreground mb-1 text-xs">名</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp className="size-3" />
            <span>前月比+{summary.active_change_percent}%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border py-4">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-xs">休会中</p>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-2xl font-semibold">
              {summary.suspended_count.toLocaleString()}
            </span>
            <span className="text-muted-foreground mb-1 text-xs">名</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">全体の{summary.suspended_percent}%</p>
        </CardContent>
      </Card>

      <Card className="border py-4">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-xs">未納金発生</p>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-destructive text-2xl font-semibold">
              {summary.unpaid_count.toLocaleString()}
            </span>
            <span className="text-muted-foreground mb-1 text-xs">名</span>
          </div>
          <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
            <AlertCircle className="size-3" />
            <span>合計 {formatYen(summary.unpaid_total_yen)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border py-4">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-xs">今月退会予定</p>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-2xl font-semibold">
              {summary.scheduled_withdrawal_count.toLocaleString()}
            </span>
            <span className="text-muted-foreground mb-1 text-xs">名</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            退会率{summary.withdrawal_rate_percent}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
