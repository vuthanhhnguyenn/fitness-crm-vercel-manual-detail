'use client';

import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmControllersByIdResponse } from '@/lib/api/types.gen';

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

interface ControllerInfoCardProps {
  controller: ControllerDetail;
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

export function ControllerInfoCard({ controller }: ControllerInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">接点制御装置情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="接点制御装置ID">
            <p className="text-sm font-medium">{controller.controller_id}</p>
          </Field>
          <Field label="装置名">{renderNullable(controller.name)}</Field>
          <Field label="店舗コード">
            <p className="text-sm font-medium">{controller.store_code}</p>
          </Field>
          <Field label="設置場所">
            <p className="text-sm font-medium">{controller.location}</p>
          </Field>
          <Field label="IPアドレス">
            <span className="font-mono text-sm font-medium">{controller.ip_address}</span>
          </Field>
          <Field label="ファームウェアバージョン">
            {renderNullable(controller.firmware_version, true)}
          </Field>
          <Field label="制御ポート数">
            <p className="text-sm font-medium tabular-nums">{controller.control_port_count}</p>
          </Field>
          <Field label="ポート番号">
            <p className="font-mono text-sm font-medium tabular-nums">{controller.port}</p>
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
