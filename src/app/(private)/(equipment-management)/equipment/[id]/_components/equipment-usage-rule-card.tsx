'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';

import { EQUIPMENT_CONTRACT_LINK_TYPE_LABELS } from '../../_constants/constants';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

interface EquipmentUsageRuleCardProps {
  equipment: EquipmentDetail;
}

function renderNullableLabel(value: string | null) {
  return value ? (
    <p className="text-sm font-medium">{value}</p>
  ) : (
    <p className="text-muted-foreground text-sm">—</p>
  );
}

export function EquipmentUsageRuleCard({ equipment }: EquipmentUsageRuleCardProps) {
  const rule = equipment.usage_control_rule;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">利用制御ルール</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">紐づき契約種別</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {rule.contract_link_types.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs font-normal">
                  {EQUIPMENT_CONTRACT_LINK_TYPE_LABELS[type]}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">オプション種別</p>
            {renderNullableLabel(rule.option_type_label)}
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">主契約タイプ</p>
            {renderNullableLabel(rule.main_contract_type_label)}
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">都度オプション種別</p>
            {renderNullableLabel(rule.per_use_option_type_label)}
          </div>
          {rule.show_gate_stop_info ? (
            <div className="bg-info/15 border-info/20 mt-1 rounded-md border px-3 py-2">
              <p className="text-info text-xs font-medium">ゲートストップ条件</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                入退館ゲートの場合: ブラックリスト登録済み / 未納（滞納） / 家族会員利用中
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
