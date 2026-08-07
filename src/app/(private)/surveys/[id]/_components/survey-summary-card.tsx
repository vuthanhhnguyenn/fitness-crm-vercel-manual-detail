import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SurveySummaryCardProps {
  totalResponses: number;
  monthlyResponses: number;
  responseRate: number;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export function SurveySummaryCard({
  totalResponses,
  monthlyResponses,
  responseRate,
}: SurveySummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">回答サマリー</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <SummaryRow label="総回答数" value={`${totalResponses.toLocaleString()}件`} />
          <SummaryRow label="今月の回答" value={`${monthlyResponses.toLocaleString()}件`} />
          <SummaryRow label="回答率" value={`${responseRate.toFixed(1)}%`} />
        </div>
      </CardContent>
    </Card>
  );
}
