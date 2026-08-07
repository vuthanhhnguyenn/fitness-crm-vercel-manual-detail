'use client';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmControllersByIdDevicesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmControllersByIdDevicesResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CONTROLLER_STATUS_BADGE_MAP, CONTROLLER_STATUS_LABELS } from '../../_constants/constants';

type DeviceRow = GetCrmControllersByIdDevicesResponse['devices'][number];

interface ControllerDevicesTabProps {
  controllerId: string;
}

export function ControllerDevicesTab({ controllerId }: ControllerDevicesTabProps) {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    ...getCrmControllersByIdDevicesOptions({ path: { id: controllerId } }),
  });

  const devices: DeviceRow[] = data?.devices ?? [];
  const summary = data?.summary;

  if (isLoading) {
    return (
      <Card className="gap-0 py-0">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[140px] text-xs font-semibold">接続機器ID</TableHead>
              <TableHead className="text-xs font-semibold">接続機器名</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold">接点番号</TableHead>
              <TableHead className="w-[160px] text-xs font-semibold">ゲート種別</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length > 0 ? (
              devices.map((device) => {
                const statusBadge = CONTROLLER_STATUS_BADGE_MAP[device.status];

                return (
                  <TableRow
                    key={device.equipment_id}
                    className="cursor-pointer"
                    onClick={() => router.push(navigate('/equipment/[id]', device.equipment_id))}
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {device.equipment_id}
                    </TableCell>
                    <TableCell className="text-sm">{device.name}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {device.controller_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {device.gate_type ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge.badgeClassName}>
                        <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
                        {CONTROLLER_STATUS_LABELS[device.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                  紐付いている機器はありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {summary ? (
          <div className="bg-muted/50 flex flex-wrap items-center gap-4 border-t px-4 py-3">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              合計: <span className="text-foreground font-semibold">{summary.total}台</span>
            </div>
            <span className="text-border">|</span>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              正常: <span className="text-success font-semibold">{summary.normal}台</span>
            </div>
            <span className="text-border">|</span>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              異常: <span className="text-destructive font-semibold">{summary.error}台</span>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
