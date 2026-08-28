import { DollarSign } from 'lucide-react';

import { Card } from '@/components/ui/card';

export function FeeEmptyState() {
  return (
    <Card className="flex min-h-[190px] items-center justify-center rounded-lg border">
      <div className="flex flex-col items-center gap-3 text-center">
        <DollarSign className="text-muted-foreground size-8" />
        <p className="text-sm font-medium text-slate-600">費用マスタが登録されていません</p>
      </div>
    </Card>
  );
}
