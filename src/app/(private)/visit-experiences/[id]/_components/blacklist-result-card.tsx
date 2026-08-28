import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { navigate } from '@/lib/routes/routes.util';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface BlacklistResultCardProps {
  record: VisitExperienceDetail;
}

export function BlacklistResultCard({ record }: BlacklistResultCardProps) {
  const hasMatch = record.bl_match;
  const isChecking = record.status === 'bl_checking' && !hasMatch;

  let content: React.ReactNode;
  if (hasMatch) {
    content = (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-medium">照合済み：一致あり</span>
        </div>
        {record.bl_match_reason && (
          <ul className="flex flex-col gap-1 pl-6">
            <li className="text-destructive list-disc text-sm">{record.bl_match_reason}</li>
          </ul>
        )}
        <a
          href={navigate('/members/blacklist')}
          className="text-destructive hover:text-destructive/80 w-fit text-xs underline-offset-2 hover:underline"
        >
          該当BLエントリの詳細を確認 →
        </a>
      </div>
    );
  } else if (isChecking) {
    content = (
      <Alert className="py-2">
        <AlertTriangle className="size-4" />
        <AlertDescription className="text-xs">照合中です。結果をお待ちください。</AlertDescription>
      </Alert>
    );
  } else {
    content = (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="text-success size-4 shrink-0" />
        <span className="text-muted-foreground text-sm">照合済み：該当なし</span>
      </div>
    );
  }

  return (
    <Card className={hasMatch ? 'border-destructive/50 bg-destructive/15' : undefined}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">ブラックリスト照合結果</CardTitle>
      </CardHeader>
      <CardContent className="px-4">{content}</CardContent>
    </Card>
  );
}
