'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Clock } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
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

import { getCrmTrainingEquipmentByEquipmentIdStatusHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { InstallationStatus } from '@/lib/api/types.gen';

import { TRAINING_EQUIPMENT_HISTORY_PAGE_SIZE } from '../../_constants/training-equipment.constants';
import {
  getInstallationStatusBadgeClass,
  getInstallationStatusDotClass,
  getInstallationStatusLabel,
} from '../../_utils/training-equipment-display.util';

type TrainingEquipmentHistoryTabProps = { equipmentId: string; enabled?: boolean };

function StatusBadge({ status }: { status: InstallationStatus }) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs font-medium ${getInstallationStatusBadgeClass(status)}`}
    >
      <span className={`size-1.5 rounded-full ${getInstallationStatusDotClass(status)}`} />
      {getInstallationStatusLabel(status)}
    </Badge>
  );
}

const DAY_IN_MS = 1000 * 60 * 60 * 24;

/** Footer count of changes within the last year. Every row stays listed; only the summary is capped to one year. */
function countWithinLastYear(items: Array<{ changedAt: string }>): number {
  const threshold = Date.now() - 365 * DAY_IN_MS;
  return items.filter((item) => {
    const changedAt = new Date(item.changedAt).getTime();
    return !Number.isNaN(changedAt) && changedAt >= threshold;
  }).length;
}

function getAverageIntervalDays(items: Array<{ changedAt: string }>): number | null {
  const timestamps = items
    .map((item) => new Date(item.changedAt).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => right - left);
  if (timestamps.length < 2) return null;

  const intervals: number[] = [];
  for (let index = 0; index < timestamps.length - 1; index += 1) {
    intervals.push((timestamps[index] - timestamps[index + 1]) / DAY_IN_MS);
  }
  return Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length);
}

/** FR-011: read-only in Phase 1 (no edit or delete actions are offered). */
export function TrainingEquipmentHistoryTab({
  equipmentId,
  enabled = true,
}: TrainingEquipmentHistoryTabProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    // The prototype defines no pager UI, so fetch up to what a single page can display.
    ...getCrmTrainingEquipmentByEquipmentIdStatusHistoryOptions({
      path: { equipmentId },
      query: { limit: TRAINING_EQUIPMENT_HISTORY_PAGE_SIZE },
    }),
    enabled,
  });
  const items = data?.items ?? [];
  // When not every row was fetched, the summary below only counts what was fetched.
  const totalItems = data?.pagination?.totalItems ?? items.length;
  const isTruncated = totalItems > items.length;

  if (isLoading || isError) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={false}
        onRetry={() => refetch()}
        errorTitle="変更履歴の取得に失敗しました"
      />
    );
  }

  const averageInterval = getAverageIntervalDays(items);

  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">日時</TableHead>
            <TableHead className="text-xs font-semibold">操作者</TableHead>
            <TableHead className="text-xs font-semibold">設置状態変化</TableHead>
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
                  {formatDateYYYYMMDD_HHMM(row.changedAt, '—')}
                </TableCell>
                <TableCell className="text-sm">{row.changedByName ?? '—'}</TableCell>
                <TableCell className="text-sm">
                  <span className="inline-flex items-center gap-2">
                    {row.previousStatus ? (
                      <StatusBadge status={row.previousStatus} />
                    ) : (
                      <span className="text-muted-foreground text-xs">未設定</span>
                    )}
                    <span className="text-muted-foreground">→</span>
                    <StatusBadge status={row.newStatus} />
                  </span>
                </TableCell>
                {/* The shared cell is `whitespace-nowrap`, which would stretch the table far past
                    the viewport for a reason at its 500-character limit. */}
                <TableCell className="max-w-105 text-sm wrap-break-word whitespace-normal">
                  {row.changedReason}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {items.length > 0 && (
        <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <ClipboardList className="size-3" />
            直近1年の対応:{' '}
            <span className="text-foreground font-semibold">{countWithinLastYear(items)}回</span>
          </div>
          <span className="text-border">|</span>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Clock className="size-3" />
            平均対応間隔:{' '}
            <span className="text-foreground font-semibold">
              {averageInterval != null ? `${averageInterval}日` : '—'}
            </span>
          </div>
          {isTruncated && (
            <p className="text-warning basis-full text-xs">
              全{totalItems}件のうち最新{items.length}件を表示しています（上の集計も表示分のみ）
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
