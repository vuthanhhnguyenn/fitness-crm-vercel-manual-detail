import Link from 'next/link';

import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { navigate } from '@/lib/routes/routes.util';

import type { ApplicationDetail } from './membership-application.utils';

interface BlacklistResultCardProps {
  app: ApplicationDetail;
}

export function BlacklistResultCard({ app }: Readonly<BlacklistResultCardProps>) {
  const matched = app.blacklist_state === 'matched';
  const incomplete = app.blacklist_state === 'incomplete';

  return (
    <Card className={matched ? 'border-destructive/50 bg-destructive/10' : ''}>
      <CardHeader>
        <CardTitle className="text-sm">ブラックリスト照合結果</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {incomplete ? (
          <div className="flex items-center gap-2">
            <HelpCircle className="text-warning size-4 shrink-0" />
            <span className="text-warning text-sm font-medium">照合未完了：再照合が必要です</span>
          </div>
        ) : matched ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-destructive size-4 shrink-0" />
              <span className="text-destructive text-sm font-medium">照合済み：一致あり</span>
            </div>
            <ul className="flex flex-col gap-1 pl-6">
              {app.blacklist_conditions.map((cond) => (
                <li key={cond.condition} className="text-destructive list-disc text-sm">
                  {cond.label}
                </li>
              ))}
            </ul>
            <Button
              nativeButton={false}
              variant="link"
              size="sm"
              className="text-destructive w-fit px-0 text-xs"
              render={
                <Link
                  href={navigate(
                    '/members/blacklist/[id]',
                    app.blacklist_conditions[0]?.blacklist_entry_id ?? '',
                  )}
                />
              }
            >
              該当BLエントリの詳細を確認 →
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle className="text-success size-4 shrink-0" />
            <span className="text-muted-foreground text-sm">照合済み：該当なし</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
