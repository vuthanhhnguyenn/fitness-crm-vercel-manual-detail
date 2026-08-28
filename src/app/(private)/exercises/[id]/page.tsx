'use client';

import { Suspense, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  deleteCrmExercisesByIdMutation,
  getCrmExercisesByIdOptions,
  getCrmExercisesByIdQueryKey,
  getCrmExercisesQueryKey,
  postCrmExercisesByIdPublishStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { ExerciseDeleteDialogs } from '../_components/exercise-delete-dialogs';
import { EXERCISE_STATUS_BADGE_CLASSES, EXERCISE_STATUS_LABELS } from '../_constants/constants';
import { BasicInfoTab } from './_components/basic-info-tab';
import { ExerciseDetailSkeleton } from './_components/exercise-detail-skeleton';
import { ExplanationStepsTab } from './_components/explanation-steps-tab';
import { RelatedInfoTab } from './_components/related-info-tab';

function ExerciseDetailPageContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [deleteMode, setDeleteMode] = useState<'blocked' | 'confirm' | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmExercisesByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    ...postCrmExercisesByIdPublishStatusMutation(),
    onSuccess: () => {
      toast.success('ステータスを更新しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmExercisesByIdQueryKey({ path: { id } }),
      });
      void queryClient.invalidateQueries({ queryKey: getCrmExercisesQueryKey() });
    },
    onError: () => {
      toast.error('処理に失敗しました');
    },
  });

  const deleteMutation = useMutation({
    ...deleteCrmExercisesByIdMutation(),
    onSuccess: () => {
      toast.success('エクササイズを削除しました');
      void queryClient.invalidateQueries({ queryKey: getCrmExercisesQueryKey() });
      router.push(navigate('/exercises'));
    },
    onError: () => {
      toast.error('処理に失敗しました');
    },
  });

  const exercise = data?.exercise;
  const hasIncompleteSteps =
    exercise?.explanationSteps.some((step) => step.textJa.trim().length === 0) ?? false;

  if (isLoading) {
    return <ExerciseDetailSkeleton />;
  }

  if (isError || !exercise) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!exercise}
        onRetry={() => refetch()}
        emptyTitle="エクササイズが見つかりません"
        emptyDescription="指定されたエクササイズは存在しないか、削除された可能性があります。"
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="エクササイズ管理に戻る" href={navigate('/exercises')} />}
        title={exercise.nameJa}
        badge={
          <Badge
            variant="outline"
            className={cn('text-xs', EXERCISE_STATUS_BADGE_CLASSES[exercise.publishStatus])}
          >
            {EXERCISE_STATUS_LABELS[exercise.publishStatus]}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.ExercisesEdit}
              variant="default"
              onClick={() => router.push(navigate('/exercises/[id]/edit', exercise.id))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>
            <DropdownMenu>
              <DropdownMenuTrigger className="border-input hover:bg-accent flex size-9 items-center justify-center rounded-md border">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RoleGatedMenuItem
                  requiredPermission={Permission.ExercisesDelete}
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteMode(exercise.canDelete ? 'confirm' : 'blocked')}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <div className="px-6 pt-4">
          <TabsList variant="line">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="steps">解説ステップ</TabsTrigger>
            <TabsTrigger value="related">関連情報</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-4">
          <BasicInfoTab
            exercise={exercise}
            onOpenPublishStatusDialog={() => setStatusDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="steps" className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-4">
          <ExplanationStepsTab explanationSteps={exercise.explanationSteps} />
        </TabsContent>

        <TabsContent value="related" className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-4">
          <RelatedInfoTab tags={exercise.tags} relatedExercises={exercise.relatedExercises} />
        </TabsContent>
      </Tabs>

      <ExerciseDeleteDialogs
        mode={deleteMode}
        open={Boolean(deleteMode)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteMode(null);
          }
        }}
        exerciseName={exercise.nameJa}
        blockReason={exercise.deleteBlockReason}
        onConfirmDelete={() => deleteMutation.mutate({ path: { id: exercise.id } })}
      />

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {exercise.publishStatus === 'private'
                ? 'エクササイズを公開しますか？'
                : 'エクササイズを非公開にしますか？'}
            </AlertDialogTitle>
            <div className="text-muted-foreground space-y-3 text-sm">
              {exercise.publishStatus === 'private' ? (
                <div>「{exercise.nameJa}」を公開し、モバイルアプリで会員に表示します。</div>
              ) : (
                <div>
                  「{exercise.nameJa}
                  」は非公開に変更され、モバイルアプリで会員に表示されなくなります。
                </div>
              )}
              {exercise.publishStatus === 'private' && hasIncompleteSteps ? (
                <Alert className="border-warning/50 bg-warning/15">
                  <AlertTriangle className="text-warning size-4" />
                  <AlertDescription className="text-xs">
                    解説ステップ（ステップ0〜4）に未入力の項目があります。未入力のまま公開できますが、モバイルアプリで解説が表示されません。
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                exercise.publishStatus === 'public'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined,
              )}
              onClick={() =>
                statusMutation.mutate(
                  {
                    path: { id: exercise.id },
                    body: {
                      publishStatus: exercise.publishStatus === 'private' ? 'public' : 'private',
                    },
                  },
                  {
                    onSuccess: () => setStatusDialogOpen(false),
                  },
                )
              }
            >
              {exercise.publishStatus === 'private' ? '公開する' : '非公開にする'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ExerciseDetailPage() {
  return (
    <Suspense fallback={<ExerciseDetailSkeleton />}>
      <ExerciseDetailPageContent />
    </Suspense>
  );
}
