'use client';

import { Badge } from '@/components/ui/badge';

interface PromoCodeUsageSummaryProps {
  issuedCount: number;
  totalUsage: number;
}

export function PromoCodeUsageSummary({ issuedCount, totalUsage }: PromoCodeUsageSummaryProps) {
  return (
    <div className="bg-muted/50 flex items-center gap-4 border-t px-4 py-3">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Badge variant="outline" className="border-border text-[10px]">
          発行数: <span className="text-foreground ml-1 font-semibold">{issuedCount}件</span>
        </Badge>
      </div>
      <span className="text-border">|</span>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Badge variant="outline" className="border-border text-[10px]">
          総利用: <span className="text-foreground ml-1 font-semibold">{totalUsage}回</span>
        </Badge>
      </div>
    </div>
  );
}
