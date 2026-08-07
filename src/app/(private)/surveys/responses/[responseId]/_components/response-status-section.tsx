import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { cn } from '@/lib/utils';

import { SURVEY_RESPONSE_STATUS_LABELS, formatSurveyDateOnly } from '../../../_constants/constants';

interface ResponseStatusSectionProps {
  status: 'completed' | 'partial';
  responseDate: string;
}

export function ResponseStatusSection({
  status,
  responseDate,
}: Readonly<ResponseStatusSectionProps>) {
  const statusBadgeClass =
    status === 'completed'
      ? 'bg-success/15 text-success border-success/20'
      : 'bg-warning/15 text-warning border-warning/20';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">回答ステータス</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">ステータス</p>
            <Badge variant="outline" className={cn('text-xs font-normal', statusBadgeClass)}>
              {SURVEY_RESPONSE_STATUS_LABELS[status]}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">回答日時</p>
            <p className="text-sm">{formatSurveyDateOnly(responseDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
