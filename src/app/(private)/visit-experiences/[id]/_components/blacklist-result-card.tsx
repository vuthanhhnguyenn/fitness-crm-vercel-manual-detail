import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { navigate } from '@/lib/routes/routes.util';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface BlacklistResultCardProps {
  record: VisitExperienceDetail;
}

export function BlacklistResultCard({ record }: BlacklistResultCardProps) {
  const isChecking = record.status === 'bl_checking';
  const hasMatch = record.bl_match;

  return (
    <Card className={hasMatch ? 'border-destructive/30' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldAlert
            className={`size-4 ${hasMatch ? 'text-destructive' : 'text-muted-foreground'}`}
          />
          ブラックリスト照合
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isChecking && !hasMatch && (
          <Alert className="py-2">
            <AlertTriangle className="size-4" />
            <AlertDescription className="text-xs">
              照合中です。結果をお待ちください。
            </AlertDescription>
          </Alert>
        )}

        {hasMatch && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="size-4" />
            <AlertTitle className="text-xs font-semibold">BL一致あり</AlertTitle>
            <AlertDescription className="text-xs">
              {record.bl_match_reason && (
                <span className="block">一致内容: {record.bl_match_reason}</span>
              )}
              許可を発行する場合はリスクを確認の上、慎重に判断してください。
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">照合ステータス</span>
          <Badge
            variant="outline"
            className={
              hasMatch
                ? 'border-destructive/20 bg-destructive/10 text-destructive'
                : isChecking
                  ? 'border-warning/20 bg-warning/10 text-warning'
                  : 'border-success/20 bg-success/10 text-success'
            }
          >
            {hasMatch ? (
              <>
                <AlertTriangle className="mr-1 size-3" />
                一致あり
              </>
            ) : isChecking ? (
              '照合中'
            ) : (
              <>
                <CheckCircle2 className="mr-1 size-3" />
                該当なし
              </>
            )}
          </Badge>
        </div>

        {hasMatch && (
          <a
            href={navigate('/members/blacklist')}
            className="text-destructive hover:text-destructive/80 block text-xs underline-offset-2 hover:underline"
          >
            ブラックリスト一覧を確認 →
          </a>
        )}
      </CardContent>
    </Card>
  );
}
