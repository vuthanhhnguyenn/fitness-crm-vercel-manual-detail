import { Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface TimelineCardProps {
  record: VisitExperienceDetail;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TimelineCard({ record }: TimelineCardProps) {
  const entries = [...record.timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="size-4" />
          対応履歴
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-xs">履歴がありません</p>
        ) : (
          <ol className="border-border relative border-l pl-4">
            {entries.map((entry, idx) => (
              <li key={idx} className="mb-4 last:mb-0">
                <div className="border-background bg-muted-foreground/40 absolute -left-1.5 mt-1 size-3 rounded-full border" />
                <time className="text-muted-foreground text-xs">
                  {formatTimestamp(entry.timestamp)}
                </time>
                <p className="mt-0.5 text-sm font-medium">{entry.content}</p>
                <p className="text-muted-foreground text-xs">{entry.operator}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
