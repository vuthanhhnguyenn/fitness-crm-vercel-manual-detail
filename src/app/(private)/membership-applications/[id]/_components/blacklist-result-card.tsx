import { AlertTriangle, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BlacklistResultCardProps {
  blacklistMatch: boolean;
  blacklistConditions: string[];
}

export function BlacklistResultCard({
  blacklistMatch,
  blacklistConditions,
}: Readonly<BlacklistResultCardProps>) {
  return (
    <Card className={blacklistMatch ? 'border-destructive/50 bg-destructive/10' : ''}>
      <CardHeader>
        <CardTitle className="text-sm">ブラックリスト照合結果</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {blacklistMatch ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-destructive size-4 shrink-0" />
              <span className="text-destructive text-sm font-medium">照合済み：一致あり</span>
            </div>
            <ul className="flex flex-col gap-1 pl-6">
              {blacklistConditions.map((cond) => (
                <li key={cond} className="text-destructive list-disc text-sm">
                  {cond}
                </li>
              ))}
            </ul>
            <Button variant="link" size="sm" className="text-destructive w-fit px-0 text-xs">
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
