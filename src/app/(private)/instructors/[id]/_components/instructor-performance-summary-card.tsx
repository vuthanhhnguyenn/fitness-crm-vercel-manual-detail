import { Card, CardContent } from '@/components/ui/card';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';

type PerformanceSummary = GetCrmInstructorsByIdResponse['performance_summary'];

export function InstructorPerformanceSummaryCard({ summary }: { summary: PerformanceSummary }) {
  return (
    <Card>
      <CardContent className="px-4">
        <h3 className="mb-4 text-sm font-bold">実績サマリー</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-primary text-2xl font-bold">{summary.weekly_lesson_count}</div>
            <div className="text-muted-foreground mt-1 text-xs">週間レッスン数</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-success text-2xl font-bold">
              {summary.average_reservation_rate}
              <span className="text-sm">%</span>
            </div>
            <div className="text-muted-foreground mt-1 text-xs">平均予約率</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">
              {summary.average_rating != null ? (
                summary.average_rating.toFixed(1)
              ) : (
                <span className="text-muted-foreground text-sm">評価なし</span>
              )}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">評価平均</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{summary.monthly_participant_count}</div>
            <div className="text-muted-foreground mt-1 text-xs">今月参加者数</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
