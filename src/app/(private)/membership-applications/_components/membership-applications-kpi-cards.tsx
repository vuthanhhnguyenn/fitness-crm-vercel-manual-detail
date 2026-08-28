import { Card } from '@/components/ui/card';

import type { MembershipApplicationSummary } from '@/lib/api/types.gen';

interface MembershipApplicationsKpiCardsProps {
  summary: MembershipApplicationSummary | undefined;
  isLoading: boolean;
  isError?: boolean;
}

/**
 * Two KPI cards read from the server-computed `summary` (FR-004, research R3) —
 * a paginated response cannot be counted client-side. 未成年 is not shown here:
 * mobile-app validation makes it a non-issue in practice (research R8).
 */
export function MembershipApplicationsKpiCards({
  summary,
  isLoading,
  isError = false,
}: Readonly<MembershipApplicationsKpiCardsProps>) {
  // A fetch error must not render as "0" — that reads as a genuinely
  // empty/clean queue (BUG-C01-08) rather than "we don't know right now".
  const showPlaceholder = isLoading || isError;
  const pending = summary?.pending_count ?? 0;
  const blacklistAlert = summary?.blacklist_count ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 未審査 — persistent warning border regardless of count */}
      <Card className="border-warning/50 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">未審査</span>
          <div className="flex items-baseline gap-2">
            <span className="text-warning text-2xl font-semibold">
              {showPlaceholder ? '—' : pending}
            </span>
            <span className="text-muted-foreground text-xs">件</span>
          </div>
        </div>
      </Card>

      {/* BL要注意 — success at 0, destructive with a destructive border above 0 */}
      <Card className={`p-4 ${blacklistAlert > 0 ? 'border-destructive/50' : ''}`}>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">BL要注意</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-semibold ${blacklistAlert === 0 ? 'text-success' : 'text-destructive'}`}
            >
              {showPlaceholder ? '—' : blacklistAlert}
            </span>
            <span className="text-muted-foreground text-xs">件</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
