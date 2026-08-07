'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

interface EquipmentMetaCardProps {
  equipment: EquipmentDetail;
}

export function EquipmentMetaCard({ equipment }: EquipmentMetaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">その他情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">作成日時</p>
            <p className="text-sm">{formatDateYYYYMMDD_HHMM(equipment.created_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">更新日時</p>
            <p className="text-sm">{formatDateYYYYMMDD_HHMM(equipment.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
