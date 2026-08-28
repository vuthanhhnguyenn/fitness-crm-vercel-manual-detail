'use client';

import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Dumbbell, Link2, RefreshCw, TriangleAlert, Wrench, X } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { StatusCard } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { TrainingEquipmentDetail } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { LOCATION_IN_GYM_LABELS } from '../../_constants/training-equipment.constants';
import {
  getInstallationStatusLabel,
  getInstallationStatusTone,
} from '../../_utils/training-equipment-display.util';

type TrainingEquipmentBasicInfoTabProps = {
  equipment: TrainingEquipmentDetail;
  onStatusChange: () => void;
};

export function TrainingEquipmentBasicInfoTab({
  equipment,
  onStatusChange,
}: TrainingEquipmentBasicInfoTabProps) {
  const { statusCard } = equipment;
  const StatusIcon =
    statusCard.installationStatus === 'maintenance'
      ? Wrench
      : statusCard.installationStatus === 'removed'
        ? TriangleAlert
        : statusCard.installationStatus === 'discarded'
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
              {/* FR-004 asks for every attribute on the detail view; the id was previously only
                  visible inside the status-change dialog. */}
              <div>
                <p className="text-muted-foreground mb-1 text-xs">機材ID</p>
                <p className="text-sm font-medium">{equipment.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">機材名</p>
                <p className="text-sm font-medium">{equipment.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">器具種別</p>
                <Badge variant="secondary" className="text-xs font-normal">
                  {equipment.toolName}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">メーカー</p>
                <p className="text-sm font-medium">{equipment.manufacturer ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">型番</p>
                <p className="text-sm font-medium">{equipment.model ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">数量</p>
                <p className="text-sm font-medium">{equipment.quantity}台</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">エクササイズ紐づき件数</p>
                <div className="flex items-center gap-2">
                  <Link2 className="text-muted-foreground size-4" />
                  <p className="text-sm font-medium">{equipment.linkedExercises.length}件</p>
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
                <p className="text-sm font-medium">{equipment.storeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">設置エリア</p>
                <p className="text-sm font-medium">
                  {equipment.locationInGym ? LOCATION_IN_GYM_LABELS[equipment.locationInGym] : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">設置日</p>
                <p className="text-sm font-medium">
                  {formatDateYYYYMMDD(equipment.installedOn, '—')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-[40%]">
        <div className="flex flex-col gap-4">
          {/* Only the status card sticks: making the whole column sticky had no effect, because the
              column is as tall as its own content (a long 備考 scrolled the action out of reach). */}
          <div className="lg:sticky lg:top-4 lg:z-10">
            <StatusCard
              tone={getInstallationStatusTone(statusCard.installationStatus)}
              icon={StatusIcon}
              label={getInstallationStatusLabel(statusCard.installationStatus)}
              meta={[
                `変更日時: ${formatDateYYYYMMDD_HHMM(statusCard.lastChangedAt, '—')}`,
                `変更者: ${statusCard.lastChangedByName ?? '—'}`,
              ]}
              action={
                <RoleGatedButton
                  requiredPermission={Permission.TrainingEquipmentEdit}
                  denyTooltip="設置状態変更の権限がありません"
                  size="sm"
                  variant="outline"
                  fullWidth
                  className="gap-1"
                  onClick={onStatusChange}
                >
                  <RefreshCw className="size-4" />
                  設置状態変更
                </RoleGatedButton>
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">備考</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {equipment.note?.trim() ? equipment.note : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
