'use client';

import { useRouter } from 'next/navigation';

import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { EQUIPMENT_STATUS_BADGE_MAP, EQUIPMENT_STATUS_LABELS } from '../../_constants/constants';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

interface EquipmentControllerCardProps {
  equipment: EquipmentDetail;
}

export function EquipmentControllerCard({ equipment }: EquipmentControllerCardProps) {
  const router = useRouter();
  const controller = equipment.controller_summary;
  const statusBadge = EQUIPMENT_STATUS_BADGE_MAP[controller.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">接点制御装置</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">装置名</span>
            <span className="text-sm font-medium">装置ID: {controller.controller_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">IP:ポート</span>
            <span className="font-mono text-sm font-medium">
              {controller.ip_address}:{controller.port}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">ステータス</span>
            <Badge variant="outline" className={statusBadge.badgeClassName}>
              <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
              {EQUIPMENT_STATUS_LABELS[controller.status]}
            </Badge>
          </div>
          <div className="border-t pt-2">
            <Button
              variant="link"
              size="sm"
              className="h-auto gap-1 p-0 text-xs"
              onClick={() => router.push(navigate('/controllers/[id]', controller.controller_id))}
            >
              装置詳細を見る
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
