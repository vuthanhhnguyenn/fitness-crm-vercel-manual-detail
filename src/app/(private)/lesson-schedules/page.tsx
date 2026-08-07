'use client';

import { Suspense, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  getCrmLessonSchedulesOptions,
  getCrmLessonSchedulesStoresSummaryOptions,
  getCrmLessonSchedulesSummaryOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission, UserRole } from '@/types/permission.type';

import { AreaKpiSummary } from './_components/area-kpi-summary';
import { AreaSummaryTable } from './_components/area-summary-table';
import { KpiSummary } from './_components/kpi-summary';
import {
  AreaKpiSkeleton,
  LessonScheduleKpiSkeleton,
  LessonSchedulePageSkeleton,
} from './_components/lesson-schedule-skeletons';
import { LessonScheduleToolbar } from './_components/lesson-schedule-toolbar';
import { ScheduleChangeModal } from './_components/schedule-change-modal';
import { ScheduleListView } from './_components/schedule-list-view';
import { TimelineView } from './_components/timeline-view';
import { WeeklyCalendarView } from './_components/weekly-calendar-view';
import { LessonScheduleFiltersProvider } from './_contexts/lesson-schedule-filters-context';
import { useLessonScheduleFiltersContext } from './_contexts/lesson-schedule-filters-context';

// ---------------------------------------------------------------------------
// Inner page (needs filter context)
// ---------------------------------------------------------------------------

function LessonSchedulePageInner() {
  const router = useRouter();
  const { user, isLoading: isUserLoading, hasPermission } = useAuthUser();
  const isTrainer = user?.role === UserRole.Trainer;
  const canManageSchedule = hasPermission(Permission.LessonsScheduleManage);
  const isAllStore =
    user?.role === UserRole.Headquarter ||
    user?.role === UserRole.System ||
    user?.role === UserRole.Manager;

  const { filters, setFilters, schedulesQueryParams, kpiQueryParams, storeSummaryQueryParams } =
    useLessonScheduleFiltersContext();

  // Trainer is locked to my_schedule axis
  const effectiveAxis = isTrainer ? 'my_schedule' : filters.axis;

  const effectiveQueryParams = {
    ...schedulesQueryParams,
    axis: effectiveAxis,
    store_id:
      filters.focused_store_id && effectiveAxis === 'store'
        ? filters.focused_store_id
        : schedulesQueryParams.store_id,
  };

  // --- Queries ---
  const schedulesQuery = useQuery({
    ...getCrmLessonSchedulesOptions({ query: effectiveQueryParams }),
  });

  const kpiQuery = useQuery({
    ...getCrmLessonSchedulesSummaryOptions({ query: kpiQueryParams }),
  });

  const storeSummaryQuery = useQuery({
    ...getCrmLessonSchedulesStoresSummaryOptions({ query: storeSummaryQueryParams }),
    enabled: isAllStore && effectiveAxis === 'store',
  });

  const [changeTarget, setChangeTarget] = useState<LessonScheduleListItem | null>(null);

  const handleScheduleClick = (schedule: LessonScheduleListItem) => {
    router.push(navigate('/lesson-schedules/[id]/reservations', schedule.id));
  };

  // Derive filter options from loaded data
  const schedules = schedulesQuery.data?.schedules ?? [];
  const uniqueInstructors = Array.from(
    new Map(
      schedules.map((s) => [s.instructor_id, { id: s.instructor_id, name: s.instructor_name }]),
    ).values(),
  );
  const uniqueStudios = Array.from(
    new Set(schedules.map((s) => s.studio_name).filter(Boolean) as string[]),
  );
  const storeList =
    storeSummaryQuery.data?.stores?.map((s) => ({ id: s.store_id, name: s.store_name })) ?? [];

  // All-store summary mode: only when HQ/Sys/Mgr, store axis, no focused store filter
  const isAllStoreSummaryMode =
    isAllStore && effectiveAxis === 'store' && !filters.focused_store_id;

  if (isUserLoading) {
    return <LessonSchedulePageSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title="予約管理"
        actions={
          <RoleGatedButton
            requiredPermission={Permission.LessonsScheduleManage}
            size="sm"
            onClick={() => router.push(navigate('/lesson-schedules/create'))}
          >
            <Plus className="size-4" />
            スケジュール登録
          </RoleGatedButton>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        {/* View axis tabs */}
        <Tabs
          value={effectiveAxis}
          onValueChange={(v) => {
            if (!isTrainer)
              setFilters({ axis: v as 'store' | 'my_schedule', focused_store_id: null });
          }}
          className="shrink-0 gap-0"
        >
          <TabsList variant="line">
            <TabsTrigger value="store" disabled={isTrainer} className="text-sm">
              店舗別
            </TabsTrigger>
            <TabsTrigger value="my_schedule" className="text-sm">
              自分のスケジュール
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* All-store summary mode: Area KPI + store summary table */}
        {isAllStoreSummaryMode && (
          <>
            <DataStateBoundary
              isLoading={storeSummaryQuery.isLoading}
              isError={storeSummaryQuery.isError}
              isEmpty={!storeSummaryQuery.data?.areas?.length}
              onRetry={() => storeSummaryQuery.refetch()}
              skeleton={<AreaKpiSkeleton />}
              emptyTitle="エリアデータがありません"
            >
              {storeSummaryQuery.data && (
                <div className="space-y-4">
                  <AreaKpiSummary
                    areas={storeSummaryQuery.data.areas}
                    stores={storeSummaryQuery.data.stores}
                  />
                  <AreaSummaryTable
                    stores={storeSummaryQuery.data.stores}
                    focusedStoreId={filters.focused_store_id}
                    onStoreClick={(id) =>
                      setFilters({
                        focused_store_id: id === filters.focused_store_id ? null : id,
                      })
                    }
                  />
                </div>
              )}
            </DataStateBoundary>
          </>
        )}

        {/* Focused store header (all-store mode + store selected) */}
        {isAllStore && effectiveAxis === 'store' && filters.focused_store_id && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground text-sm font-semibold">店舗詳細:</span>
            <span className="text-sm font-bold">
              {storeList.find((s) => s.id === filters.focused_store_id)?.name ??
                filters.focused_store_id}
            </span>
            <Badge variant="outline" className="text-xs">
              詳細表示中
            </Badge>
            （AreaSummaryの行をクリックして切替）
          </div>
        )}

        {/* KPI Summary */}
        <DataStateBoundary
          isLoading={kpiQuery.isLoading}
          isError={kpiQuery.isError}
          isEmpty={!kpiQuery.data}
          onRetry={() => kpiQuery.refetch()}
          skeleton={<LessonScheduleKpiSkeleton />}
          emptyTitle="KPIデータがありません"
        >
          {kpiQuery.data && <KpiSummary kpi={kpiQuery.data.kpi} />}
        </DataStateBoundary>

        {/* Toolbar: date nav + view mode + filters */}
        <LessonScheduleToolbar
          stores={storeList}
          instructors={uniqueInstructors}
          studios={uniqueStudios}
          isTrainer={isTrainer}
        />

        {/* Schedule view */}
        <DataStateBoundary
          isLoading={schedulesQuery.isLoading}
          isError={schedulesQuery.isError}
          isEmpty={schedules.length === 0 && !schedulesQuery.isLoading}
          onRetry={() => schedulesQuery.refetch()}
          emptyTitle="レッスンが見つかりません"
          emptyDescription="条件を変更して再検索してください"
        >
          {filters.view === 'day' && (
            <TimelineView
              schedules={schedules}
              isLoading={schedulesQuery.isFetching && !schedulesQuery.data}
              showBookedMembers={effectiveAxis === 'my_schedule'}
              onScheduleClick={handleScheduleClick}
              onEditClick={setChangeTarget}
              canEdit={canManageSchedule}
            />
          )}
          {filters.view === 'week' && (
            <WeeklyCalendarView
              schedules={schedules}
              weekStart={filters.week_start}
              isLoading={schedulesQuery.isFetching && !schedulesQuery.data}
              onScheduleClick={handleScheduleClick}
              onEditClick={setChangeTarget}
              canEdit={canManageSchedule}
            />
          )}
          {filters.view === 'list' && (
            <ScheduleListView
              schedules={schedules}
              isLoading={schedulesQuery.isFetching && !schedulesQuery.data}
              onScheduleClick={handleScheduleClick}
            />
          )}
        </DataStateBoundary>
      </div>

      {/* Schedule change modal */}
      <ScheduleChangeModal
        open={!!changeTarget}
        schedule={changeTarget}
        onOpenChange={(open) => {
          if (!open) setChangeTarget(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper — provides filter context
// ---------------------------------------------------------------------------

export default function LessonSchedulesPage() {
  return (
    <Suspense fallback={<LessonSchedulePageSkeleton />}>
      <LessonScheduleFiltersProvider>
        <LessonSchedulePageInner />
      </LessonScheduleFiltersProvider>
    </Suspense>
  );
}
