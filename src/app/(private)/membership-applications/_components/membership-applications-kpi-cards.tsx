import { Card } from '@/components/ui/card';

import type { MembershipApplication } from '@/lib/api/types.gen';

import { IN_QUEUE_STATUSES } from '../_constants/constants';

interface MembershipApplicationsKpiCardsProps {
  applications: MembershipApplication[];
}

export function MembershipApplicationsKpiCards({
  applications,
}: Readonly<MembershipApplicationsKpiCardsProps>) {
  const inQueue = (app: MembershipApplication) =>
    (IN_QUEUE_STATUSES as string[]).includes(app.status);

  const pending = applications.filter(inQueue).length;
  const blacklistAlert = applications.filter((app) => inQueue(app) && app.blacklist_match).length;
  const minorPending = applications.filter((app) => inQueue(app) && app.is_minor === true).length;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 未審査キュー */}
      <Card className="border-warning/50 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">未審査</span>
          <div className="flex items-baseline gap-2">
            <span className="text-warning text-2xl font-semibold">{pending}</span>
            <span className="text-muted-foreground text-xs">件</span>
          </div>
        </div>
      </Card>

      {/* BL要注意 */}
      <Card className={`p-4 ${blacklistAlert > 0 ? 'border-destructive/50' : ''}`}>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">BL要注意</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-semibold ${blacklistAlert === 0 ? 'text-success' : 'text-destructive'}`}
            >
              {blacklistAlert}
            </span>
            <span className="text-muted-foreground text-xs">件</span>
          </div>
        </div>
      </Card>

      {/* 未成年 */}
      <Card className={`p-4 ${minorPending > 0 ? 'border-info/50' : ''}`}>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">未成年</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-semibold ${minorPending === 0 ? '' : 'text-info'}`}>
              {minorPending}
            </span>
            <span className="text-muted-foreground text-xs">件</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
