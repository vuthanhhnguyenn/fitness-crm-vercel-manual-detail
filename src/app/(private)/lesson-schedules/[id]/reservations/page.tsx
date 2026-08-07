'use client';

import { use, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { parseAsInteger, useQueryState } from 'nuqs';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';

import {
  getCrmLessonSchedulesByScheduleIdMemosOptions,
  getCrmLessonSchedulesByScheduleIdReservationsOptions,
  getCrmLessonSchedulesByScheduleIdReservationsStatsOptions,
  getCrmLessonSchedulesByScheduleIdSpacesOptions,
  getCrmLessonSchedulesOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ReservationPageActions } from './_components/reservation-page-actions';
import { ReservationPageLayout } from './_components/reservation-page-layout';
import {
  LessonHeaderSkeleton,
  ReservationListSkeleton,
  ReservationStatsSkeleton,
  SpaceGridSkeleton,
} from './_components/reservation-page-skeletons';

function formatScheduleDate(iso: string): string {
  try {
    return format(new Date(iso), 'M月d日（E）', { locale: ja });
  } catch {
    return iso;
  }
}

function formatScheduleTimeRange(start: string, end: string): string {
  try {
    return `${format(new Date(start), 'HH:mm')}〜${format(new Date(end), 'HH:mm')}`;
  } catch {
    return `${start}〜${end}`;
  }
}

export default function LessonReservationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = use(params);
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));

  const scheduleQuery = useQuery({
    ...getCrmLessonSchedulesOptions(),
    select: (data) => data.schedules.find((s) => s.id === scheduleId),
  });

  const reservationsQuery = useQuery({
    ...getCrmLessonSchedulesByScheduleIdReservationsOptions({
      path: { scheduleId },
      query: { page, pageSize: 7 },
    }),
  });

  const statsQuery = useQuery({
    ...getCrmLessonSchedulesByScheduleIdReservationsStatsOptions({
      path: { scheduleId },
    }),
  });

  const spacesQuery = useQuery({
    ...getCrmLessonSchedulesByScheduleIdSpacesOptions({
      path: { scheduleId },
    }),
  });

  const memosQuery = useQuery({
    ...getCrmLessonSchedulesByScheduleIdMemosOptions({
      path: { scheduleId },
    }),
  });

  const schedule = scheduleQuery.data;
  const stats = statsQuery.data?.stats;
  const scheduleIsCancelled = schedule?.status === 'cancelled';
  const scheduleCancellationKey = schedule ? `${schedule.id}:${schedule.status}` : null;
  const [cancellationOverride, setCancellationOverride] = useState<{
    scheduleKey: string;
    value: boolean;
  } | null>(null);

  const isCancelled =
    scheduleCancellationKey && cancellationOverride?.scheduleKey === scheduleCancellationKey
      ? cancellationOverride.value
      : scheduleIsCancelled;

  const handleIsCancelledChange = (cancelled: boolean) => {
    if (scheduleCancellationKey) {
      setCancellationOverride({ scheduleKey: scheduleCancellationKey, value: cancelled });
    }
  };

  const isAllReady =
    schedule && reservationsQuery.data && statsQuery.data && spacesQuery.data && memosQuery.data;

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="予約管理に戻る" href={navigate('/lesson-schedules')} />}
        title={schedule?.lesson_name ?? '予約詳細'}
        subtitle={
          schedule
            ? [
                `${formatScheduleDate(schedule.start_time)} ${formatScheduleTimeRange(schedule.start_time, schedule.end_time)}`,
                schedule.studio_name,
                schedule.instructor_name ? `担当: ${schedule.instructor_name}` : null,
              ]
                .filter(Boolean)
                .join(' | ')
            : undefined
        }
        badge={
          isCancelled ? (
            <Badge variant="destructive" className="text-xs">
              中止済み
            </Badge>
          ) : stats ? (
            <Badge variant="outline" className="text-xs">
              {stats.total_reserved}/{stats.total_capacity} 予約済（残り{stats.remaining_seats}席）
            </Badge>
          ) : undefined
        }
        actions={
          isAllReady ? (
            <ReservationPageActions
              scheduleId={scheduleId}
              schedule={schedule}
              isCancelled={isCancelled}
              onIsCancelledChange={handleIsCancelledChange}
            />
          ) : undefined
        }
      />

      {isAllReady ? (
        <ReservationPageLayout
          scheduleId={scheduleId}
          schedule={schedule}
          reservationsData={reservationsQuery.data}
          statsData={statsQuery.data}
          spacesData={spacesQuery.data}
          memosData={memosQuery.data}
          isCancelled={isCancelled}
        />
      ) : (
        <div className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Left column skeletons */}
            <div className="flex min-w-0 flex-3 flex-col gap-4">
              <DataStateBoundary
                isLoading={scheduleQuery.isLoading}
                isError={scheduleQuery.isError}
                isEmpty={!schedule}
                onRetry={() => scheduleQuery.refetch()}
                skeleton={<LessonHeaderSkeleton />}
                emptyTitle="レッスンが見つかりません"
                emptyDescription="スケジュールIDを確認してください"
                errorTitle="レッスン情報の取得に失敗しました"
              >
                {null}
              </DataStateBoundary>

              <DataStateBoundary
                isLoading={spacesQuery.isLoading}
                isError={spacesQuery.isError}
                isEmpty={!spacesQuery.data?.spaces?.length}
                onRetry={() => spacesQuery.refetch()}
                skeleton={<SpaceGridSkeleton />}
                emptyTitle="スペース情報がありません"
                errorTitle="スペース情報の取得に失敗しました"
              >
                {null}
              </DataStateBoundary>

              <DataStateBoundary
                isLoading={reservationsQuery.isLoading}
                isError={reservationsQuery.isError}
                isEmpty={false}
                onRetry={() => reservationsQuery.refetch()}
                skeleton={<ReservationListSkeleton />}
                emptyTitle="予約者はいません"
                errorTitle="予約一覧の取得に失敗しました"
              >
                {null}
              </DataStateBoundary>
            </div>

            {/* Right column skeletons */}
            <div className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-0 lg:w-[40%] lg:self-start">
              <DataStateBoundary
                isLoading={statsQuery.isLoading || memosQuery.isLoading}
                isError={statsQuery.isError || memosQuery.isError}
                isEmpty={false}
                onRetry={() => {
                  statsQuery.refetch();
                  memosQuery.refetch();
                }}
                skeleton={<ReservationStatsSkeleton />}
                emptyTitle="情報がありません"
                errorTitle="情報の取得に失敗しました"
              >
                {null}
              </DataStateBoundary>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
