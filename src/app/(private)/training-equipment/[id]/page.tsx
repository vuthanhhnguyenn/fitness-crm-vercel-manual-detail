'use client';

import { Suspense, use, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getApiErrorStatus } from '@/lib/api-error.util';
import {
  deleteCrmTrainingEquipmentByEquipmentIdMutation,
  getCrmTrainingEquipmentByEquipmentIdOptions,
  getCrmTrainingEquipmentByEquipmentIdQueryKey,
  getCrmTrainingEquipmentByEquipmentIdStatusHistoryQueryKey,
  getCrmTrainingEquipmentQueryKey,
  patchCrmTrainingEquipmentByEquipmentIdInstallationStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  getInstallationStatusBadgeClass,
  getInstallationStatusDotClass,
  getInstallationStatusLabel,
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
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum([...DETAIL_TABS]).withDefault('basic'),
  );
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: equipment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...getCrmTrainingEquipmentByEquipmentIdOptions({ path: { equipmentId: id } }),
  });

  // The failure itself is reported by the global error handler. What this screen still owes the
  // user is recovery: a `404` means the record was deleted elsewhere and is no longer there to act
  // on, so the dialogs are closed, the list is refreshed and the user is taken back to it.
  const handleMutationError = (error: unknown) => {
    if (getApiErrorStatus(error) !== 404) return;
    setStatusDialogOpen(false);
    setDeleteDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
    router.push(navigate('/training-equipment'));
  };

  const statusMutation = useMutation({
    ...patchCrmTrainingEquipmentByEquipmentIdInstallationStatusMutation(),
    onSuccess: () => {
      toast.success('設置状態を変更しました');
      setStatusDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdQueryKey({ path: { equipmentId: id } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdStatusHistoryQueryKey({
          path: { equipmentId: id },
        }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    ...deleteCrmTrainingEquipmentByEquipmentIdMutation(),
    onSuccess: () => {
      toast.success('トレーニング機材を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
      router.push(navigate('/training-equipment'));
    },
    onError: handleMutationError,
  });

  // Distinguish a fetch failure (network / permission error) from "not found" and render each differently.
  if (isLoading || isError || !equipment) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!equipment}
        onRetry={() => refetch()}
        errorTitle="トレーニング機材の取得に失敗しました"
        emptyTitle="機材が見つかりませんでした"
      />
    );
  }

  const linkedExerciseCount = equipment.linkedExercises.length;

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
            className={`gap-1 text-xs font-medium ${getInstallationStatusBadgeClass(equipment.installationStatus)}`}
          >
            <span
              className={`size-1.5 rounded-full ${getInstallationStatusDotClass(equipment.installationStatus)}`}
            />
            {getInstallationStatusLabel(equipment.installationStatus)}
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

      {/* No scroll container of its own: the page already scrolls in the layout's `main`, and an
          extra (non-scrolling) overflow box here becomes the scrollport for the sticky status card,
          which then never sticks. */}
      <div className="bg-background flex-1 px-6 py-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => void setActiveTab(value as (typeof DETAIL_TABS)[number])}
          className="gap-4"
        >
          <TabsList variant="line">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="exercises">
              エクササイズ紐づけ
              {linkedExerciseCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
                >
                  {linkedExerciseCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <TrainingEquipmentBasicInfoTab
              equipment={equipment}
              onStatusChange={() => setStatusDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="exercises">
            <TrainingEquipmentExerciseLinkSection
              equipmentId={id}
              equipment={equipment}
              enabled={activeTab === 'exercises'}
            />
          </TabsContent>

          <TabsContent value="history">
            <TrainingEquipmentHistoryTab equipmentId={id} enabled={activeTab === 'history'} />
          </TabsContent>
        </Tabs>
      </div>

      <TrainingEquipmentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        equipment={equipment}
        isSubmitting={statusMutation.isPending}
        isSubmitError={statusMutation.isError}
        onSubmit={(payload) => statusMutation.mutate({ path: { equipmentId: id }, body: payload })}
      />

      <TrainingEquipmentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        equipment={equipment}
        isSubmitting={deleteMutation.isPending}
        isSubmitError={deleteMutation.isError}
        onConfirm={() => deleteMutation.mutate({ path: { equipmentId: id } })}
      />
    </>
  );
}
