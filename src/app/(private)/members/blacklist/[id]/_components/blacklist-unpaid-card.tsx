import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { cn } from '@/lib/utils';

interface BlacklistUnpaidCardProps {
  unpaidAmount: number;
}

export function BlacklistUnpaidCard({ unpaidAmount }: BlacklistUnpaidCardProps) {
  const hasDebt = unpaidAmount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">未納金</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <span
          className={cn(
            'text-2xl font-bold',
            hasDebt ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          ¥{unpaidAmount.toLocaleString()}
        </span>
        {hasDebt && (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
          >
            未収
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
