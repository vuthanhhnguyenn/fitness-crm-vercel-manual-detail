'use client';

import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';

import { EQUIPMENT_AUTHENTICATION_LABELS, EQUIPMENT_TYPE_LABELS } from '../../_constants/constants';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

interface EquipmentInfoCardProps {
  equipment: EquipmentDetail;
}

function renderNullable(value: string | null, monospace = false) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={monospace ? 'font-mono text-sm font-medium' : 'text-sm font-medium'}>
      {value}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {children}
    </div>
  );
}

export function EquipmentInfoCard({ equipment }: EquipmentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">接続機器情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="接続機器ID">
            <p className="text-sm font-medium">{equipment.id}</p>
          </Field>
          <Field label="接続機器名">
            <p className="text-sm font-medium">{equipment.name}</p>
          </Field>
          <Field label="機器タイプ">
            <Badge variant="secondary" className="text-xs font-normal">
              {EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}
            </Badge>
          </Field>
          <Field label="シリアルナンバー">{renderNullable(equipment.serial_number, true)}</Field>
          <Field label="IPアドレス">{renderNullable(equipment.ip_address, true)}</Field>
          <Field label="MACアドレス">{renderNullable(equipment.mac_address, true)}</Field>
          <Field label="設置場所">
            <p className="text-sm font-medium">{equipment.install_location}</p>
          </Field>
          <Field label="設置日">
            <p className="text-sm font-medium">{equipment.installed_on.replace(/-/g, '/')}</p>
          </Field>
          <Field label="認証方式">
            <p className="text-sm font-medium">
              {EQUIPMENT_AUTHENTICATION_LABELS[equipment.authentication_method]}
            </p>
          </Field>
          <Field label="接点制御先番号">
            <p className="text-sm font-medium">{equipment.controller_number}</p>
          </Field>
          <Field label="QRコードID">{renderNullable(equipment.qr_code_id)}</Field>
        </div>
      </CardContent>
    </Card>
  );
}
