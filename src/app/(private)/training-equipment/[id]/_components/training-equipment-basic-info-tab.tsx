'use client';

import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Dumbbell, Link2, RefreshCw, TriangleAlert, Wrench, X } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { StatusCard } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { TRAINING_EQUIPMENT_LOCATION_IN_GYM_LABELS } from '../../_constants/training-equipment.constants';
import {
  getTrainingEquipmentStatusLabel,
  getTrainingEquipmentStatusTone,
} from '../../_utils/training-equipment-display.util';

type TrainingEquipmentBasicInfoTabProps = {
  equipment: TrainingEquipmentItem;
  onStatusChange: () => void;
};

export function TrainingEquipmentBasicInfoTab({
  equipment,
  onStatusChange,
}: TrainingEquipmentBasicInfoTabProps) {
  const tone = getTrainingEquipmentStatusTone(equipment.status);
  const statusLabel = getTrainingEquipmentStatusLabel(equipment.status);
  const StatusIcon =
    equipment.status === 'maintenance'
      ? Wrench
      : equipment.status === 'removed'
        ? TriangleAlert
        : equipment.status === 'discarded'
          ? X
          : Dumbbell;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-[60%]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">機材基本情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">機材名</p>
                <p className="text-sm font-medium">{equipment.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">器具種別</p>
                <Badge variant="secondary" className="text-xs font-normal">
                  {equipment.tool_name ?? equipment.tool_type}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">メーカー</p>
                <p className="text-sm font-medium">{equipment.manufacturer ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">型番</p>
                <p className="text-sm font-medium">{equipment.model_number ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">数量</p>
                <p className="text-sm font-medium">{equipment.quantity}台</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">エクササイズ紐づき件数</p>
                <div className="flex items-center gap-2">
                  <Link2 className="text-muted-foreground size-4" />
                  <p className="text-sm font-medium">{equipment.linked_exercise_count}件</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">設置情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">設置店舗</p>
                <p className="text-sm font-medium">{equipment.store_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">設置エリア</p>
                <p className="text-sm font-medium">
                  {equipment.installation_area
                    ? TRAINING_EQUIPMENT_LOCATION_IN_GYM_LABELS[equipment.installation_area]
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">設置日</p>
                <p className="text-sm font-medium">
                  {formatDateYYYYMMDD(equipment.installed_on, '—')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <StatusCard
            tone={tone}
            icon={StatusIcon}
            label={statusLabel}
            meta={[
              `変更日時: ${formatDateYYYYMMDD_HHMM(equipment.last_updated_at, '—')}`,
              `変更者: ${equipment.last_updated_by}`,
            ]}
            action={
              <RoleGatedButton
                requiredPermission={Permission.TrainingEquipmentEdit}
                denyTooltip="ステータス変更の権限がありません"
                size="sm"
                variant="outline"
                fullWidth
                className="gap-1"
                onClick={onStatusChange}
              >
                <RefreshCw className="size-4" />
                ステータス変更
              </RoleGatedButton>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">備考</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {equipment.notes?.trim() ? equipment.notes : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
