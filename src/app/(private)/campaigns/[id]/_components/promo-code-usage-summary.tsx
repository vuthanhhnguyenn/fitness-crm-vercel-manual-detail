'use client';

import { Ticket, UserCheck } from 'lucide-react';

interface PromoCodeUsageSummaryProps {
  issuedCount: number;
  totalUsedCount: number;
}

/** V0 campaign-detail.tsx:L860-880 の Summary Footer。 */
export function PromoCodeUsageSummary({
  issuedCount,
  totalUsedCount,
}: Readonly<PromoCodeUsageSummaryProps>) {
  return (
    <div className="bg-muted/50 flex items-center gap-4 border-t px-4 py-3">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Ticket className="size-3" />
        発行数: <span className="text-foreground font-semibold">{issuedCount}件</span>
      </div>
      <span className="text-border">|</span>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <UserCheck className="size-3" />
        総利用: <span className="text-foreground font-semibold">{totalUsedCount}回</span>
      </div>
    </div>
  );
}
