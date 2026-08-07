import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { cn } from '@/lib/utils';

interface BlacklistResultSectionProps {
  readonly state: 'unchecked' | 'no-match' | 'match';
}

const CONFIG = {
  unchecked: {
    badgeClass: 'bg-warning/15 text-warning border-warning/20',
    badgeLabel: '未照合',
    description: '申請者情報を入力後、照合が自動実行されます。',
    cardClass: '',
  },
  'no-match': {
    badgeClass: 'bg-success/15 text-success border-success/20',
    badgeLabel: '照合済み：該当なし',
    description: 'ブラックリストとの一致はありません。',
    cardClass: '',
  },
  match: {
    badgeClass: 'bg-destructive/15 text-destructive border-destructive/20',
    badgeLabel: '照合済み：一致あり',
    description: '申請者情報がブラックリストと一致しています。審査を慎重に行ってください。',
    cardClass: 'border-destructive/50 bg-destructive/10',
  },
} as const;

export function BlacklistResultSection({ state }: BlacklistResultSectionProps) {
  const cfg = CONFIG[state];

  return (
    <Card className={cn(cfg.cardClass)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ブラックリスト照合結果
          <Badge variant="outline" className={cn('text-xs', cfg.badgeClass)}>
            {cfg.badgeLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{cfg.description}</p>
      </CardContent>
    </Card>
  );
}
