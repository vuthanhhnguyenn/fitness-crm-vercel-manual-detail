'use client';

import { useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmInstructorsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { InstructorAssignedLessonsCard } from './_components/instructor-assigned-lessons-card';
import { InstructorBasicInfoCard } from './_components/instructor-basic-info-card';
import { InstructorBufferSettingsCard } from './_components/instructor-buffer-settings-card';
import { InstructorCrmLinkCard } from './_components/instructor-crm-link-card';
import { InstructorDeleteDialog } from './_components/instructor-delete-dialog';
import { InstructorDetailSkeleton } from './_components/instructor-detail-skeleton';
import { InstructorHistoryTab } from './_components/instructor-history-tab';
import { InstructorPerformanceSummaryCard } from './_components/instructor-performance-summary-card';
import { InstructorProfileCard } from './_components/instructor-profile-card';
import { InstructorStatusCard } from './_components/instructor-status-card';
import { InstructorUpcomingScheduleCard } from './_components/instructor-upcoming-schedule-card';

const ROLE_LABELS: Record<string, string> = {
  trainer: 'トレーナー',
  instructor: 'インストラクター',
  body_care_therapist: 'ボディケアセラピスト',
};

export default function InstructorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const instructorId = params.id as string;
  const fromContext = searchParams.get('from');
  const fromLessonDetail = fromContext === 'lesson-detail';
  const lessonName = searchParams.get('lessonName');
  const backLabel = fromLessonDetail
    ? lessonName
      ? `${lessonName}に戻る`
      : 'レッスン詳細に戻る'
    : '指導者管理に戻る';
  const [activeTab, setActiveTab] = useState('basic');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuthUser();

  const {
    data: detailData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...getCrmInstructorsByIdOptions({ path: { id: instructorId } }),
    enabled: Boolean(instructorId),
  });
  const isNotFound = error?.message === 'NOT_FOUND';
  const instructor = detailData?.data;

  if (!instructor) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError && !isNotFound}
        isEmpty={isNotFound || !instructor}
        onRetry={() => void refetch()}
        emptyTitle="指導者が見つかりません"
        emptyDescription={`指定された指導者ID（${instructorId}）は存在しないか、参照権限がありません。`}
        skeleton={<InstructorDetailSkeleton />}
      />
    );
  }

  const isSelf = user?.id === instructor.instructor_id;
  const instructorFullName = `${instructor.last_name} ${instructor.first_name}`;

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError && !isNotFound}
      isEmpty={isNotFound || !instructor}
      onRetry={() => void refetch()}
      emptyTitle="指導者が見つかりません"
      emptyDescription={`指定された指導者ID（${instructorId}）は存在しないか、参照権限がありません。`}
      skeleton={<InstructorDetailSkeleton />}
    >
      <div className="flex flex-col">
        <PageHeader
          breadcrumb={
            fromLessonDetail ? (
              <BackLink label={backLabel} onClick={() => router.back()} />
            ) : (
              <BackLink label={backLabel} href={navigate('/instructors')} />
            )
          }
          title={instructorFullName}
          badge={
            <>
              {instructor.role_classifications.map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="bg-info/10 text-info border-info/20 text-[11px]"
                >
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              ))}
              {instructor.status === 'active' ? (
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20 text-[11px]"
                >
                  有効
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground border-muted-foreground/20 text-[11px]"
                >
                  無効
                </Badge>
              )}
            </>
          }
          actions={
            <div className="flex items-center gap-2">
              <RoleGatedButton
                allowedRoles={[UserRole.System, UserRole.Headquarter, UserRole.Manager]}
                denyTooltip="削除は本部・マネージャーのみ可能です"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive gap-1"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="size-4" />
                削除
              </RoleGatedButton>
              <RoleGatedButton
                allowedRoles={
                  isSelf
                    ? [
                        UserRole.System,
                        UserRole.Headquarter,
                        UserRole.Manager,
                        UserRole.Staff,
                        UserRole.Trainer,
                      ]
                    : [UserRole.System, UserRole.Headquarter, UserRole.Manager, UserRole.Staff]
                }
                denyTooltip="編集権限がありません"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => router.push(navigate('/instructors/[id]/edit', instructorId))}
              >
                <Pencil className="size-4" />
                編集
              </RoleGatedButton>
            </div>
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
                  <InstructorBasicInfoCard instructor={instructor} />
                  <InstructorCrmLinkCard crmAccountLink={instructor.crm_account_link} />
                  <InstructorProfileCard instructor={instructor} />
                  <InstructorBufferSettingsCard bufferSettings={instructor.buffer_settings} />
                </div>

                <div className="w-90 shrink-0 space-y-4">
                  <InstructorStatusCard
                    instructorId={instructor.instructor_id}
                    instructorName={instructorFullName}
                    status={instructor.status}
                  />
                  <InstructorPerformanceSummaryCard summary={detailData.performance_summary} />
                  <InstructorAssignedLessonsCard lessons={detailData.assigned_lessons} />
                  <InstructorUpcomingScheduleCard
                    instructorName={instructorFullName}
                    entries={detailData.upcoming_schedule.entries}
                    recurringSummary={detailData.upcoming_schedule.recurring_summary}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              <InstructorHistoryTab
                instructorId={instructorId}
                instructorName={instructorFullName}
                active={activeTab === 'history'}
              />
            </TabsContent>
          </Tabs>
        </div>

        <InstructorDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          instructorId={instructor.instructor_id}
          instructorName={instructorFullName}
          assignedScheduleCount={instructor.assigned_schedule_count}
        />
      </div>
    </DataStateBoundary>
  );
}
