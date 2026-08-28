'use client';

import { useState } from 'react';

import { formatDateYYYYMM } from '@/utils/date.util';
import { formatYen } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays } from 'date-fns';
import { Settings2 } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdFeeAdjustmentsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersByIdFeeAdjustmentsResponse } from '@/lib/api/types.gen';

import { UserRole } from '@/types/permission.type';

import { FeeAdjustmentSheet } from './fee-adjustment-sheet';

type FeeAdjustment = GetCrmMembersByIdFeeAdjustmentsResponse['items'][number];

const PATTERN_LABELS: Record<FeeAdjustment['pattern'], string> = {
  amount: '金額指定',
  discount_amount: '値引き額指定',
  discount_rate: '割引率指定',
  markup_amount: '値増し額指定',
};

const STATUS_META: Record<FeeAdjustment['status'], { label: string; className: string }> = {
  active: { label: '適用中', className: 'border-success/20 bg-success/15 text-success' },
  scheduled: { label: '適用予定', className: 'border-info/20 bg-info/15 text-info' },
  ended: { label: '終了', className: 'text-muted-foreground border-border bg-muted' },
};

const ALLOWED_ROLES = [UserRole.Headquarter, UserRole.System, UserRole.Manager] as const;

/**
 * `value` arrives as an unsigned magnitude (the pattern carries the direction), so the sign has to
 * be rendered from the pattern: 割引率 → `-x%`, 値引き額 → `-¥x`, 値増し額 → `+¥x`,
 * 金額指定 → plain `¥x` (it replaces the fee rather than adjusting it).
 */
function formatValue(adj: FeeAdjustment): string {
  const magnitude = Math.abs(adj.value);
  switch (adj.pattern) {
    case 'discount_rate':
      return `-${magnitude}%`;
    case 'discount_amount':
      return `-${formatYen(magnitude)}`;
    case 'markup_amount':
      return `+${formatYen(magnitude)}`;
    default:
      return formatYen(magnitude);
  }
}

/** Suffix that spells out the direction next to the amount (金額指定 needs none) */
const PATTERN_SUFFIX: Partial<
  Record<FeeAdjustment['pattern'], { label: string; className: string }>
> = {
  discount_amount: { label: '値引', className: 'text-success' },
  discount_rate: { label: '値引', className: 'text-success' },
  markup_amount: { label: '値増', className: 'text-destructive' },
};

/** Days until the end date (calendar-day basis; ending today = 0) */
function getDaysUntilEnd(endDate: string): number {
  return differenceInCalendarDays(new Date(endDate), new Date());
}

interface FeeAdjustmentCardProps {
  memberId: string;
}

export function FeeAdjustmentCard({ memberId }: Readonly<FeeAdjustmentCardProps>) {
  const [showSheet, setShowSheet] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdFeeAdjustmentsOptions({
      path: { id: memberId },
    }),
  );

  const items = data?.items ?? [];

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">個別会費調整</CardTitle>
            <RoleGatedButton
              allowedRoles={ALLOWED_ROLES}
              denyTooltip="本部・マネージャー権限が必要です"
              variant="outline"
              size="sm"
              onClick={() => setShowSheet(true)}
            >
              <Settings2 className="mr-1 size-4" />
              調整を追加
            </RoleGatedButton>
          </div>
        </CardHeader>
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!data}
          onRetry={() => refetch()}
          errorTitle="個別会費調整の取得に失敗しました"
          skeleton={
            <div className="space-y-3 px-4 pb-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={`fee-adjustment-row-${index}`} className="h-9 w-full" />
              ))}
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">期間</TableHead>
                <TableHead className="text-xs font-semibold">パターン</TableHead>
                <TableHead className="text-right text-xs font-semibold">金額/率</TableHead>
                <TableHead className="text-xs font-semibold">事由</TableHead>
                <TableHead className="text-xs font-semibold">設定者</TableHead>
                <TableHead className="text-xs font-semibold">状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-6 text-center text-sm">
                    個別会費調整はありません
                  </TableCell>
                </TableRow>
              ) : (
                items.map((adj) => {
                  const daysLeft =
                    adj.status === 'active' && adj.endDate ? getDaysUntilEnd(adj.endDate) : null;
                  const status = STATUS_META[adj.status];
                  return (
                    <TableRow key={adj.id}>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {/* The period is month-based (prototype: 「2025/04 〜 2025/06」) */}
                        <div className="flex flex-col gap-0.5">
                          <span>{formatDateYYYYMM(adj.startDate)}</span>
                          <span className="text-[10px]">〜 {formatDateYYYYMM(adj.endDate)}</span>
                        </div>
                        {daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 && (
                          <Badge
                            variant="outline"
                            className="border-warning/20 bg-warning/15 text-warning mt-1 px-1 text-[9px]"
                          >
                            あと{daysLeft}日
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{PATTERN_LABELS[adj.pattern]}</TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatValue(adj)}
                        {PATTERN_SUFFIX[adj.pattern] && (
                          <span
                            className={`ml-1 text-[10px] ${PATTERN_SUFFIX[adj.pattern]!.className}`}
                          >
                            {PATTERN_SUFFIX[adj.pattern]!.label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-xs">
                        {adj.reason ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{adj.setBy}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DataStateBoundary>
      </Card>

      <FeeAdjustmentSheet open={showSheet} onOpenChange={setShowSheet} memberId={memberId} />
    </>
  );
}
