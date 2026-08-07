'use client';

import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmControllersByIdResponse } from '@/lib/api/types.gen';

import { CONTROLLER_STATUS_BADGE_MAP } from '../../_constants/constants';

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

interface ControllerDeviceSummaryCardProps {
  controller: ControllerDetail;
  onViewDevices: () => void;
}

export function ControllerDeviceSummaryCard({
  controller,
  onViewDevices,
}: ControllerDeviceSummaryCardProps) {
  const summary = controller.device_summary;
  const normalBadge = CONTROLLER_STATUS_BADGE_MAP.normal;
  const errorBadge = CONTROLLER_STATUS_BADGE_MAP.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">紐付き機器サマリー</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">紐付き機器数</span>
            <span className="text-sm font-semibold">{summary.total}台</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">正常</span>
            <Badge variant="outline" className={normalBadge.badgeClassName}>
              <span className={`size-1.5 rounded-full ${normalBadge.dotClassName}`} />
              {summary.normal}台
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">異常</span>
            <Badge variant="outline" className={errorBadge.badgeClassName}>
              <span className={`size-1.5 rounded-full ${errorBadge.dotClassName}`} />
              {summary.error}台
            </Badge>
          </div>
          <div className="border-t pt-2">
            <Button
              variant="link"
              size="sm"
              className="h-auto gap-1 p-0 text-xs"
              onClick={onViewDevices}
            >
              機器一覧を見る
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
