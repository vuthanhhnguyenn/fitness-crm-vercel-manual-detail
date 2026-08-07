'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

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

import { getCrmEquipmentByIdHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmEquipmentByIdHistoryResponse } from '@/lib/api/types.gen';

import { EQUIPMENT_STATUS_BADGE_MAP, EQUIPMENT_STATUS_LABELS } from '../../_constants/constants';

type HistoryRow = GetCrmEquipmentByIdHistoryResponse['history'][number];

interface EquipmentHistoryTabProps {
  equipmentId: string;
}

function StatusTransition({ row }: { row: HistoryRow }) {
  if (row.event_type === 'created') {
    return (
      <Badge variant="outline" className="border-info/20 bg-info/15 text-info text-xs font-medium">
        新規作成
      </Badge>
    );
  }

  const fromBadge = row.from_status ? EQUIPMENT_STATUS_BADGE_MAP[row.from_status] : null;
  const toBadge = row.to_status ? EQUIPMENT_STATUS_BADGE_MAP[row.to_status] : null;

  return (
    <span className="inline-flex items-center gap-2">
      {fromBadge && row.from_status ? (
        <Badge variant="outline" className={fromBadge.badgeClassName}>
          <span className={`size-1.5 rounded-full ${fromBadge.dotClassName}`} />
          {EQUIPMENT_STATUS_LABELS[row.from_status]}
        </Badge>
      ) : null}
      {fromBadge && toBadge ? <ArrowRight className="text-muted-foreground size-3" /> : null}
      {toBadge && row.to_status ? (
        <Badge variant="outline" className={toBadge.badgeClassName}>
          <span className={`size-1.5 rounded-full ${toBadge.dotClassName}`} />
          {EQUIPMENT_STATUS_LABELS[row.to_status]}
        </Badge>
      ) : null}
    </span>
  );
}

export function EquipmentHistoryTab({ equipmentId }: EquipmentHistoryTabProps) {
  const { data, isLoading } = useQuery({
    ...getCrmEquipmentByIdHistoryOptions({ path: { id: equipmentId } }),
  });

  const history: HistoryRow[] = data?.history ?? [];

  if (isLoading) {
    return (
      <Card className="gap-0 py-0">
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[160px] text-xs font-semibold">日時</TableHead>
            <TableHead className="w-[100px] text-xs font-semibold">操作者</TableHead>
            <TableHead className="w-[220px] text-xs font-semibold">ステータス変化</TableHead>
            <TableHead className="text-xs font-semibold">変更理由</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? (
            history.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateYYYYMMDD_HHMM(row.occurred_at)}
                </TableCell>
                <TableCell className="text-sm">{row.operator_name}</TableCell>
                <TableCell>
                  <StatusTransition row={row} />
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[280px] text-sm">
                  {row.change_reason ?? '—'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                履歴はありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
