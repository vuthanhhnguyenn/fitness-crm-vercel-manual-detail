'use client';

import { Suspense, useState } from 'react';

import { useParams } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmLessonContentsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { LessonDeleteDialog } from './_components/lesson-delete-dialog';
import { LessonDetailHeaderActions } from './_components/lesson-detail-header-actions';
import { LessonDetailSkeleton } from './_components/lesson-detail-skeleton';
import { LessonHistoryTab } from './_components/lesson-history-tab';
import { LessonInfoTab } from './_components/lesson-info-tab';
import {
  LESSON_DETAIL_STATUS_LABELS,
  LESSON_TYPE_BADGE_CLASSES,
  LESSON_TYPE_BADGE_LABELS,
} from './_constants/constants';
import { useLessonDetailNav } from './_hooks/use-lesson-detail-nav';

const STATUS_BADGE_CLASSES: Record<'active' | 'inactive', string> = {
  active: 'bg-success/15 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
};

function LessonDetailPageContent() {
  const params = useParams<{ id: string }>();
  const { hasPermission } = useAuthUser();

  const lessonId = params.id;
  const canViewHistory = hasPermission(Permission.LessonContentsHistoryView);
  const { tab, setTab, isFromSchedule } = useLessonDetailNav(canViewHistory);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmLessonContentsByIdOptions({ path: { id: lessonId } }),
    enabled: Boolean(lessonId),
  });

  if (isLoading) return <LessonDetailSkeleton />;

  if (isError || !data?.data) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.data}
        onRetry={() => refetch()}
        emptyTitle="レッスン内容が見つかりません"
        emptyDescription="指定されたレッスン内容は存在しないか、削除された可能性があります。"
      />
    );
  }

  const detail = data.data;

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={
          <BackLink
            label={isFromSchedule ? '予約管理に戻る' : 'レッスン内容に戻る'}
            href={isFromSchedule ? navigate('/lesson-schedules') : navigate('/lessons')}
          />
        }
        title={detail.name}
        badge={
          <>
            <Badge
              variant="outline"
              className={cn('gap-1 text-xs font-medium', STATUS_BADGE_CLASSES[detail.status])}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  detail.status === 'active' ? 'bg-success' : 'bg-muted-foreground',
                )}
              />
              {LESSON_DETAIL_STATUS_LABELS[detail.status]}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs', LESSON_TYPE_BADGE_CLASSES[detail.lesson_type])}
            >
              {LESSON_TYPE_BADGE_LABELS[detail.lesson_type]}
            </Badge>
          </>
        }
        actions={<LessonDetailHeaderActions detail={detail} onDelete={() => setDeleteOpen(true)} />}
      />

      <div className="px-6 py-4">
        <Tabs
          value={tab}
          onValueChange={(value) => void setTab(value as typeof tab)}
          className="gap-4"
        >
          <TabsList variant="line">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            {canViewHistory && <TabsTrigger value="history">変更履歴</TabsTrigger>}
          </TabsList>

          <TabsContent value="info">
            <LessonInfoTab detail={detail} />
          </TabsContent>

          {canViewHistory && (
            <TabsContent value="history">
              <LessonHistoryTab
                lessonId={lessonId}
                canViewHistory={canViewHistory}
                active={tab === 'history'}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <LessonDeleteDialog
        lessonName={detail.name}
        usageCount={detail.usage_count}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

export default function LessonDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LessonDetailPageContent />
    </Suspense>
  );
}
