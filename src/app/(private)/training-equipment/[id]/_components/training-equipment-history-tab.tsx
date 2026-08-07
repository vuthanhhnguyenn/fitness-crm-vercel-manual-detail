'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Clock } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmTrainingEquipmentByEquipmentIdHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';

import {
  getTrainingEquipmentStatusBadgeClass,
  getTrainingEquipmentStatusDotClass,
  getTrainingEquipmentStatusLabel,
} from '../../_utils/training-equipment-display.util';

type TrainingEquipmentHistoryTabProps = { equipmentId: string; enabled?: boolean };

function getAverageIntervalDays(items: Array<{ changed_at: string }>): number | null {
  if (items.length < 2) return null;
  const timestamps = items
    .map((item) => new Date(item.changed_at).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a);
  if (timestamps.length < 2) return null;

  const intervals: number[] = [];
  for (let index = 0; index < timestamps.length - 1; index += 1) {
    intervals.push((timestamps[index] - timestamps[index + 1]) / (1000 * 60 * 60 * 24));
  }
  return Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length);
}

export function TrainingEquipmentHistoryTab({
  equipmentId,
  enabled = true,
}: TrainingEquipmentHistoryTabProps) {
  const { data, isLoading } = useQuery({
    ...getCrmTrainingEquipmentByEquipmentIdHistoryOptions({ path: { equipmentId } }),
    enabled,
  });
  const items = data?.items ?? [];

  if (isLoading) {
    return <Loading />;
  }

  const recentCount = items.length;
  const averageInterval = getAverageIntervalDays(items);

  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">日時</TableHead>
            <TableHead className="text-xs font-semibold">操作者</TableHead>
            <TableHead className="text-xs font-semibold">ステータス変化</TableHead>
            <TableHead className="text-xs font-semibold">変更理由</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                変更履歴はありません
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateYYYYMMDD_HHMM(row.changed_at, '—')}
                </TableCell>
                <TableCell className="text-sm">{row.changed_by}</TableCell>
                <TableCell className="text-sm">
                  <span className="inline-flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`gap-1 text-xs font-medium ${getTrainingEquipmentStatusBadgeClass(row.from_status)}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${getTrainingEquipmentStatusDotClass(row.from_status)}`}
                      />
                      {getTrainingEquipmentStatusLabel(row.from_status)}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge
                      variant="outline"
                      className={`gap-1 text-xs font-medium ${getTrainingEquipmentStatusBadgeClass(row.to_status)}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${getTrainingEquipmentStatusDotClass(row.to_status)}`}
                      />
                      {getTrainingEquipmentStatusLabel(row.to_status)}
                    </Badge>
                  </span>
                </TableCell>
                <TableCell className="max-w-[280px] text-sm">{row.reason}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {items.length > 0 && (
        <div className="bg-muted/50 flex items-center gap-4 border-t px-4 py-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <ClipboardList className="size-3" />
            直近1年の対応: <span className="text-foreground font-semibold">{recentCount}回</span>
          </div>
          <span className="text-border">|</span>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Clock className="size-3" />
            平均対応間隔:{' '}
            <span className="text-foreground font-semibold">
              {averageInterval != null ? `${averageInterval}日` : '—'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
