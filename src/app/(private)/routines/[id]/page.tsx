'use client';

import { Suspense, use, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  deleteCrmRoutinesByIdMutation,
  getCrmRoutinesByIdOptions,
  getCrmRoutinesQueryKey,
  postCrmRoutinesByIdDuplicateMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { RoutineDeleteDialog } from '../_components/routine-delete-dialog';
import {
  ROUTINE_PUBLISH_STATUS_LABELS,
  getRoutinePublishStatusBadgeClass,
  getRoutinePublishStatusDotClass,
} from '../_constants/routine.constants';
import { RoutineBasicInfoTab } from './_components/routine-basic-info-tab';
import { RoutineExerciseCompositionTab } from './_components/routine-exercise-composition-tab';

type RoutineDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function RoutineDetailPage({ params }: RoutineDetailPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <RoutineDetailPageContent params={params} />
    </Suspense>
  );
}

function RoutineDetailPageContent({ params }: RoutineDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const activeTab = searchParams.get('tab') ?? 'basic';

  const handleTabChange = (tab: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmRoutinesByIdOptions({ path: { id } }),
  });

  const duplicateMutation = useMutation({
    ...postCrmRoutinesByIdDuplicateMutation(),
    onSuccess: (result) => {
      toast.success(`「${result.routine.name}」を作成しました`, {
        description: '公開ステータス: 非公開。複製先の編集画面に移動します',
      });
      queryClient.invalidateQueries({ queryKey: getCrmRoutinesQueryKey() });
      router.push(navigate('/routines/[id]/edit', result.routine.id));
    },
    onError: () => toast.error('複製に失敗しました'),
  });

  const deleteMutation = useMutation({
    ...deleteCrmRoutinesByIdMutation(),
    onSuccess: () => {
      toast.success('ルーティンを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmRoutinesQueryKey() });
      router.push(navigate('/routines'));
    },
    onError: () => toast.error('削除に失敗しました'),
  });

  const routine = data?.routine;

  if (isLoading || isError || !routine) {
    return (
      <>
        <PageHeader
          breadcrumb={<BackLink label="ルーティン管理に戻る" href={navigate('/routines')} />}
          title="ルーティン詳細"
        />
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!routine}
          onRetry={() => void refetch()}
          errorTitle="ルーティンの取得に失敗しました"
          emptyTitle="ルーティンが見つかりませんでした"
        />
      </>
    );
  }

  const isPublished = routine.publishStatus === 'published';

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="ルーティン管理に戻る" href={navigate('/routines')} />}
        title={routine.name}
        subtitle={routine.routineCode}
        badge={
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-medium ${getRoutinePublishStatusBadgeClass(routine.publishStatus)}`}
          >
            <span
              className={`size-1.5 rounded-full ${getRoutinePublishStatusDotClass(routine.publishStatus)}`}
            />
            {ROUTINE_PUBLISH_STATUS_LABELS[routine.publishStatus]}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.RoutinesCreate}
              variant="outline"
              className="gap-1"
              denyTooltip="複製の権限がありません"
              disabled={duplicateMutation.isPending}
              onClick={() => duplicateMutation.mutate({ path: { id } })}
            >
              <Copy className="size-4" />
              複製
            </RoleGatedButton>
            <RoleGatedButton
              requiredPermission={Permission.RoutinesEdit}
              variant="outline"
              className="gap-1"
              denyTooltip="編集の権限がありません"
              onClick={() => router.push(navigate('/routines/[id]/edit', id))}
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
                  requiredPermission={Permission.RoutinesDelete}
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="bg-background flex-1 overflow-auto px-6 py-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="exercises">エクササイズ構成</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <RoutineBasicInfoTab routine={routine} />
          </TabsContent>
          <TabsContent value="exercises">
            <RoutineExerciseCompositionTab routine={routine} />
          </TabsContent>
        </Tabs>
      </div>

      <RoutineDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        routineName={routine.name}
        isPublished={isPublished}
        isSubmitting={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ path: { id } })}
      />
    </>
  );
}
