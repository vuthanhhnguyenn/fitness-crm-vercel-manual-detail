'use client';

import { useState } from 'react';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Ban, Check } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmStudiosByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { StudioBasicInfoCard } from './_components/studio-basic-info-card';
import { StudioDeleteDialog } from './_components/studio-delete-dialog';
import { StudioDetailHeaderActions } from './_components/studio-detail-header-actions';
import { StudioDetailSkeleton } from './_components/studio-detail-skeleton';
import { StudioHistoryTab } from './_components/studio-history-tab';
import { StudioImagesCard } from './_components/studio-images-card';
import { StudioLayoutCard } from './_components/studio-layout-card';
import { StudioLinkedLessonsCard } from './_components/studio-linked-lessons-card';
import { StudioUtilizationCard } from './_components/studio-utilization-card';

const STUDIO_STATUS_BADGE_CLASSES: Record<'active' | 'inactive', string> = {
  active: 'bg-success/15 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
};

const STUDIO_TYPE_BADGE_CLASSES = {
  'studio-lesson': 'bg-info/10 text-info border-info/20',
  pt: 'bg-warning/10 text-warning border-warning/20',
  'body-care': 'bg-muted text-muted-foreground border-border',
} as const;

export default function StudioDetailPage() {
  const params = useParams();
  const studioId = params.id as string;
  const [activeTab, setActiveTab] = useState('basic');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: studioData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...getCrmStudiosByIdOptions({ path: { id: studioId } }),
    enabled: Boolean(studioId),
  });
  const isNotFound = error?.message === 'NOT_FOUND';

  if (!studioData?.data && !isLoading && !isError) {
    return null;
  }

  const studio = studioData?.data;
  if (!studio) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError && !isNotFound}
        isEmpty={isNotFound || !studioData?.data}
        onRetry={() => void refetch()}
        emptyTitle="スタジオが見つかりません"
        emptyDescription={`指定されたスタジオID（${studioId}）は存在しません。`}
        skeleton={<StudioDetailSkeleton />}
      />
    );
  }
  const studioTypeLabel = {
    'studio-lesson': 'スタジオレッスン',
    pt: 'パーソナル',
    'body-care': 'ボディケア',
  }[studio.studio_type];

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError && !isNotFound}
      isEmpty={isNotFound || !studioData?.data}
      onRetry={() => void refetch()}
      emptyTitle="スタジオが見つかりません"
      emptyDescription={`指定されたスタジオID（${studioId}）は存在しません。`}
      skeleton={<StudioDetailSkeleton />}
    >
      <div className="flex flex-col">
        <PageHeader
          breadcrumb={<BackLink label="スタジオ管理に戻る" href={navigate('/studios')} />}
          title={studio.name}
          badge={
            <>
              <Badge
                variant="outline"
                className={cn('text-xs font-medium', STUDIO_TYPE_BADGE_CLASSES[studio.studio_type])}
              >
                {studioTypeLabel}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 text-xs font-medium',
                  STUDIO_STATUS_BADGE_CLASSES[studio.status],
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    studio.status === 'active' ? 'bg-success' : 'bg-muted-foreground',
                  )}
                />
                {studio.status === 'active' ? '有効' : '無効'}
              </Badge>
            </>
          }
          actions={
            <StudioDetailHeaderActions
              studioId={studioId}
              onDelete={() => setShowDeleteDialog(true)}
            />
          }
        />

        <div className="px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
            <TabsList variant="line">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="history">変更履歴</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="pt-4">
              <div className="flex gap-6">
                <div className="min-w-0 flex-1 space-y-4">
                  <StudioBasicInfoCard studio={studio} />
                  <StudioLayoutCard layout={studioData.layout} />
                  <StudioImagesCard images={studioData.images} />
                </div>

                <div className="w-[360px] shrink-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">ステータス</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center px-4">
                      <div
                        className={`mb-3 flex size-20 items-center justify-center rounded-full ${
                          studio.status === 'active' ? 'bg-success/10' : 'bg-muted'
                        }`}
                      >
                        {studio.status === 'active' ? (
                          <Check className="text-success size-10" />
                        ) : (
                          <Ban className="text-muted-foreground size-10" />
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`gap-1 text-xs font-medium ${
                          studio.status === 'active'
                            ? 'bg-success/15 text-success border-success/20'
                            : 'bg-muted text-muted-foreground border-muted-foreground/20'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            studio.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
                          }`}
                        />
                        {studio.status === 'active' ? '有効' : '無効'}
                      </Badge>
                      <p className="text-muted-foreground mt-3 text-xs">
                        リンクレッスン数：{studio.assigned_lesson_count}件
                      </p>
                    </CardContent>
                  </Card>

                  <StudioUtilizationCard utilization={studioData.utilization} />

                  <StudioLinkedLessonsCard lessons={studioData.linked_lessons} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              <StudioHistoryTab studioId={studioId} active={activeTab === 'history'} />
            </TabsContent>
          </Tabs>
        </div>

        <StudioDeleteDialog
          open={showDeleteDialog}
          studioId={studioId}
          studioName={studio.name}
          assignedLessonCount={studio.assigned_lesson_count}
          onOpenChange={setShowDeleteDialog}
        />
      </div>
    </DataStateBoundary>
  );
}
