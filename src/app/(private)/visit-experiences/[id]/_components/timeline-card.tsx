import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface TimelineCardProps {
  record: VisitExperienceDetail;
}

export function TimelineCard({ record }: TimelineCardProps) {
  const entries = [...record.timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">タイムライン</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-xs">履歴がありません</p>
        ) : (
          <div className="flex flex-col gap-0">
            {entries.map((entry, i) => {
              const isSystem = entry.operator === 'システム';
              return (
                <div key={`${entry.timestamp}-${entry.operator}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`mt-2 size-2.5 shrink-0 rounded-full ${
                        isSystem ? 'bg-muted-foreground' : 'bg-primary'
                      }`}
                    />
                    {i < entries.length - 1 && <div className="bg-border mt-1 w-px flex-1" />}
                  </div>
                  <div className="flex flex-col gap-0.5 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {formatDateYYYYMMDD_HHMM(entry.timestamp)}
                      </span>
                      <span className="text-xs font-medium">{entry.operator}</span>
                    </div>
                    <p className="text-sm">{entry.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
