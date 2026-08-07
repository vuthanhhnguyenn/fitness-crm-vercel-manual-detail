'use client';

import { Suspense, use, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  deleteCrmTrainingEquipmentByEquipmentIdMutation,
  getCrmTrainingEquipmentByEquipmentIdHistoryQueryKey,
  getCrmTrainingEquipmentByEquipmentIdOptions,
  getCrmTrainingEquipmentByEquipmentIdQueryKey,
  getCrmTrainingEquipmentQueryKey,
  patchCrmTrainingEquipmentByEquipmentIdStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission, UserRole } from '@/types/permission.type';

import {
  getTrainingEquipmentStatusBadgeClass,
  getTrainingEquipmentStatusDotClass,
  getTrainingEquipmentStatusLabel,
} from '../_utils/training-equipment-display.util';
import { TrainingEquipmentBasicInfoTab } from './_components/training-equipment-basic-info-tab';
import { TrainingEquipmentDeleteDialog } from './_components/training-equipment-delete-dialog';
import { TrainingEquipmentExerciseLinkSection } from './_components/training-equipment-exercise-link-section';
import { TrainingEquipmentHistoryTab } from './_components/training-equipment-history-tab';
import { TrainingEquipmentStatusDialog } from './_components/training-equipment-status-dialog';

type TrainingEquipmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

const DETAIL_TABS = ['basic', 'exercises', 'history'] as const;

export default function TrainingEquipmentDetailPage({ params }: TrainingEquipmentDetailPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <TrainingEquipmentDetailPageContent params={params} />
    </Suspense>
  );
}

function TrainingEquipmentDetailPageContent({ params }: TrainingEquipmentDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission, hasRole } = useAuthUser();
  const canManageExerciseLinks = hasPermission(Permission.TrainingEquipmentExerciseLinks);
  const canViewHistory = hasRole([UserRole.System, UserRole.Headquarter]);
  const [rawTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum([...DETAIL_TABS]).withDefault('basic'),
  );
  const activeTab =
    (rawTab === 'exercises' && !canManageExerciseLinks) || (rawTab === 'history' && !canViewHistory)
      ? 'basic'
      : rawTab;
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: detailRes, isLoading } = useQuery({
    ...getCrmTrainingEquipmentByEquipmentIdOptions({ path: { equipmentId: id } }),
  });

  const statusMutation = useMutation({
    ...patchCrmTrainingEquipmentByEquipmentIdStatusMutation(),
    onSuccess: () => {
      toast.success('ステータスを変更しました');
      setStatusDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdQueryKey({ path: { equipmentId: id } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdHistoryQueryKey({
          path: { equipmentId: id },
        }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
    },
    onError: () => toast.error('ステータスの変更に失敗しました'),
  });

  const deleteMutation = useMutation({
    ...deleteCrmTrainingEquipmentByEquipmentIdMutation(),
    onSuccess: () => {
      toast.success('トレーニング機材を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
      router.push(navigate('/training-equipment'));
    },
    onError: () => toast.error('削除に失敗しました'),
  });

  const handleTabChange = (value: string) => {
    void setActiveTab(value as (typeof DETAIL_TABS)[number]);
  };

  if (isLoading) return <Loading />;

  const equipment = detailRes?.equipment;
  if (!equipment) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">機材が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="トレーニング機材管理に戻る" href={navigate('/training-equipment')} />
        }
        title="機材詳細"
        subtitle={equipment.name}
        badge={
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-medium ${getTrainingEquipmentStatusBadgeClass(equipment.status)}`}
          >
            <span
              className={`size-1.5 rounded-full ${getTrainingEquipmentStatusDotClass(equipment.status)}`}
            />
            {getTrainingEquipmentStatusLabel(equipment.status)}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.TrainingEquipmentDelete}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive gap-1"
              denyTooltip="トレーニング機材削除の権限がありません"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
              削除
            </RoleGatedButton>
            <RoleGatedButton
              requiredPermission={Permission.TrainingEquipmentEdit}
              variant="outline"
              size="sm"
              className="gap-1"
              denyTooltip="編集権限がありません"
              onClick={() => router.push(navigate('/training-equipment/[id]/edit', id))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>
          </div>
        }
      />

      <div className="bg-background flex-1 overflow-auto px-6 py-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            {canManageExerciseLinks && (
              <TabsTrigger value="exercises">
                エクササイズ紐づけ
                {equipment.linked_exercise_count > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
                  >
                    {equipment.linked_exercise_count}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {canViewHistory && <TabsTrigger value="history">変更履歴</TabsTrigger>}
          </TabsList>

          <TabsContent value="basic">
            <TrainingEquipmentBasicInfoTab
              equipment={equipment}
              onStatusChange={() => setStatusDialogOpen(true)}
            />
          </TabsContent>

          {canManageExerciseLinks && (
            <TabsContent value="exercises">
              <TrainingEquipmentExerciseLinkSection
                equipmentId={id}
                equipment={equipment}
                enabled={activeTab === 'exercises'}
              />
            </TabsContent>
          )}

          {canViewHistory && (
            <TabsContent value="history">
              <TrainingEquipmentHistoryTab equipmentId={id} enabled={activeTab === 'history'} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <TrainingEquipmentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        equipment={equipment}
        isSubmitting={statusMutation.isPending}
        onSubmit={(payload) =>
          statusMutation.mutate({
            path: { equipmentId: id },
            body: payload,
          })
        }
      />

      <TrainingEquipmentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        equipment={equipment}
        isSubmitting={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ path: { equipmentId: id } })}
      />
    </>
  );
}
