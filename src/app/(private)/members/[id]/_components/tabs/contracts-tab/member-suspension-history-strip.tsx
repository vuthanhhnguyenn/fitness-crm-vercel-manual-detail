'use client';

/**
 * Suspension / withdrawal history strip for the member detail (contract operations tab).
 * Fetches history from the API, converts it into per-month records, and renders it with
 * the shared `SuspensionHistoryStrip` (members/_components).
 */
import {
  type SuspensionHistoryCell,
  SuspensionHistoryStrip,
  type SuspensionStatus,
} from '@/app/(private)/members/_components/suspension-history-strip';
import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdSuspensionHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersByIdSuspensionHistoryResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  diffYearMonths,
  currentYearMonth as getCurrentYearMonth,
  normalizeYearMonth,
  shiftYearMonth,
} from '../../../_utils/month-range';

type SuspensionHistoryItem = GetCrmMembersByIdSuspensionHistoryResponse['items'][number];

/**
 * Map an API record onto a strip status.
 * Only `cancelled` records disappear from the strip: an `ended` suspension is still part of the
 * history the card is named after, so past months keep their 休会中 badge (as in the prototype).
 */
function getStripStatus(item: SuspensionHistoryItem): SuspensionStatus {
  if (item.status === 'cancelled') return 'normal';
  if (item.type === 'withdrawal_scheduled') return 'pending-retire';
  // `pending` = not started yet (休会予定); `active` / `ended` months are both rendered as 休会中
  return item.status === 'pending' ? 'pending-leave' : 'active';
}

/** Convert API items into a per-month record */
function buildHistory(
  items: SuspensionHistoryItem[],
  currentYearMonth: string,
): Record<string, SuspensionHistoryCell> {
  const record: Record<string, SuspensionHistoryCell> = {};
  for (const item of items) {
    const status = getStripStatus(item);
    // `normal` only happens for cancelled records, which must not paint the strip
    if (status === 'normal') continue;
    const start = normalizeYearMonth(item.startMonth);
    const end = item.endMonth
      ? normalizeYearMonth(item.endMonth)
      : item.status === 'active'
        ? currentYearMonth
        : start;
    const span = Math.max(0, diffYearMonths(end, start));
    for (let i = 0; i <= span; i++) {
      const ym = shiftYearMonth(start, i);
      record[ym] = { status, applicationId: i === 0 ? item.id : undefined };
    }
  }
  return record;
}

interface MemberSuspensionHistoryStripProps {
  memberId: string;
}

export function MemberSuspensionHistoryStrip({
  memberId,
}: Readonly<MemberSuspensionHistoryStripProps>) {
  const currentYearMonth = getCurrentYearMonth();

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdSuspensionHistoryOptions({
      path: { id: memberId },
    }),
  );

  const history = buildHistory(data?.items ?? [], currentYearMonth);

  // The card owns the period nav and legend, so only the strip body is swapped for Loading/Error
  const stripOverride =
    isLoading || isError || !data ? (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorTitle="休会・退会履歴の取得に失敗しました"
        emptyTitle="休会・退会履歴はありません"
        skeleton={<Skeleton className="h-24 w-full rounded-md" />}
      />
    ) : undefined;

  return (
    <SuspensionHistoryStrip
      title="休会・退会履歴"
      history={history}
      currentYearMonth={currentYearMonth}
      stripOverride={stripOverride}
      viewApplicationsHref={navigate('/members/leaves', { member_id: memberId })}
      viewApplicationsLabel="申請一覧を見る"
    />
  );
}
