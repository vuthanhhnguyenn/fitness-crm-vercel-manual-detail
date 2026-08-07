'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Ban, Check, RefreshCw, Wrench } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmControllersByIdResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  CONTROLLER_STATUS_BADGE_MAP,
  CONTROLLER_STATUS_LABELS,
  type ControllerStatus,
} from '../../_constants/constants';

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

const STATUS_ICON_MAP: Record<
  ControllerStatus,
  { icon: LucideIcon; iconClassName: string; bgClassName: string }
> = {
  normal: { icon: Check, iconClassName: 'text-success', bgClassName: 'bg-success/15' },
  error: {
    icon: AlertTriangle,
    iconClassName: 'text-destructive',
    bgClassName: 'bg-destructive/15',
  },
  maintenance: { icon: Wrench, iconClassName: 'text-warning', bgClassName: 'bg-warning/15' },
  discarded: { icon: Ban, iconClassName: 'text-muted-foreground', bgClassName: 'bg-muted' },
};

interface ControllerStatusCardProps {
  controller: ControllerDetail;
  onStatusChange: () => void;
}

export function ControllerStatusCard({ controller, onStatusChange }: ControllerStatusCardProps) {
  const statusBadge = CONTROLLER_STATUS_BADGE_MAP[controller.status];
  const statusIcon = STATUS_ICON_MAP[controller.status];
  const StatusIcon = statusIcon.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">ステータス</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center px-4">
        <div
          className={`mb-3 flex size-20 items-center justify-center rounded-full ${statusIcon.bgClassName}`}
        >
          <StatusIcon className={`size-10 ${statusIcon.iconClassName}`} />
        </div>
        <Badge variant="outline" className={statusBadge.badgeClassName}>
          <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
          {CONTROLLER_STATUS_LABELS[controller.status]}
        </Badge>
        <div className="mt-4 w-full border-t pt-4">
          <RoleGatedButton
            requiredPermission={Permission.ControllerEdit}
            denyTooltip="ステータス変更の権限がありません"
            size="sm"
            fullWidth
            onClick={onStatusChange}
            variant="outline"
          >
            <RefreshCw className="size-4" />
            ステータス変更
          </RoleGatedButton>
        </div>
      </CardContent>
    </Card>
  );
}
