'use client';

import { useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { getApiErrorStatus } from '@/lib/api-error.util';
import {
  getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey,
  getCrmTrainingEquipmentByEquipmentIdOptions,
  getCrmTrainingEquipmentByEquipmentIdQueryKey,
  getCrmTrainingEquipmentQueryKey,
  patchCrmTrainingEquipmentByEquipmentIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { TrainingEquipmentDetail } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { TrainingEquipmentFormFields } from '../../_components/training-equipment-form-fields';
import { useSubmitGuard } from '../../_hooks/use-submit-guard.hook';
import {
  type TrainingEquipmentFormSubmitValues,
  type TrainingEquipmentFormValues,
  trainingEquipmentFormSchema,
} from '../../_schemas/training-equipment-form.schema';
import {
  equipmentToFormDefaults,
  trainingEquipmentFormToUpdatePayload,
} from '../../_utils/training-equipment-form.mapper';

function TrainingEquipmentEditForm({
  equipment,
  id,
}: {
  equipment: TrainingEquipmentDetail;
  id: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [toolTypeDialogOpen, setToolTypeDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<TrainingEquipmentFormSubmitValues | null>(
    null,
  );
  const originalToolId = equipment.mstToolId;
  const linkedExerciseCount = equipment.linkedExercises.length;

  const form = useForm<TrainingEquipmentFormValues, unknown, TrainingEquipmentFormSubmitValues>({
    resolver: zodResolver(trainingEquipmentFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: equipmentToFormDefaults(equipment),
  });

  const { isDirty } = useFormState({ control: form.control });

  const updateMutation = useMutation({
    ...patchCrmTrainingEquipmentByEquipmentIdMutation(),
    onSuccess: (updated) => {
      toast.success('トレーニング機材の変更を保存しました');
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdQueryKey({ path: { equipmentId: id } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey({
          path: { equipmentId: id },
        }),
      });
      router.push(navigate('/training-equipment/[id]', updated.id));
    },
    onError: (error) => {
      // The global handler reports the failure. A `404` means the record was deleted from another
      // tab while this form was open, so saving can never succeed — refresh the list and go back.
      if (getApiErrorStatus(error) !== 404) return;
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
      router.push(navigate('/training-equipment'));
    },
  });

  const { submitOnce } = useSubmitGuard(updateMutation.isPending, updateMutation.isError);

  const submitValues = (values: TrainingEquipmentFormSubmitValues) => {
    // Guarded: rapid clicks on 更新 would otherwise send one update per click.
    submitOnce(() =>
      updateMutation.mutate({
        path: { equipmentId: id },
        body: trainingEquipmentFormToUpdatePayload(values),
      }),
    );
  };

  // FR-005: show the confirmation dialog only when the tool type changed and links exist.
  const onSubmit = (values: TrainingEquipmentFormSubmitValues) => {
    if (values.mstToolId !== originalToolId && linkedExerciseCount > 0) {
      setPendingValues(values);
      setToolTypeDialogOpen(true);
      return;
    }
    submitValues(values);
  };

  const handleSubmit = form.handleSubmit(onSubmit, scrollToFirstError);

  // Where 破棄する goes depends on which exit the user took (cancel = detail, back link = list).
  const [discardTarget, setDiscardTarget] = useState(navigate('/training-equipment/[id]', id));

  const leaveTo = (destination: string) => {
    if (isDirty) {
      setDiscardTarget(destination);
      setDiscardOpen(true);
      return;
    }
    router.push(destination);
  };

  const handleCancel = () => leaveTo(navigate('/training-equipment/[id]', id));

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink
            label="トレーニング機材管理に戻る"
            onClick={() => leaveTo(navigate('/training-equipment'))}
          />
        }
        title="トレーニング機材 編集"
      />

      <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="mx-auto max-w-240 space-y-6">
            <TrainingEquipmentFormFields
              control={form.control}
              isEdit
              currentStatus={equipment.installationStatus}
              storeNameLabel={equipment.storeName}
              storeCodeLabel={equipment.storeCode}
            />

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <Button type="button" size="lg" variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
              <Button type="submit" size="lg" disabled={!isDirty || updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '更新'}
              </Button>
            </div>
          </form>
        </Form>
      </main>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              未保存の変更はすべて失われます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(discardTarget)}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toolTypeDialogOpen} onOpenChange={setToolTypeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>器具種別を変更しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              器具種別を変更すると、紐づいているエクササイズがすべて解除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingValues) submitValues(pendingValues);
                setToolTypeDialogOpen(false);
              }}
            >
              変更する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function TrainingEquipmentEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmTrainingEquipmentByEquipmentIdOptions({ path: { equipmentId: id ?? '' } }),
    enabled: Boolean(id),
  });

  if (isLoading || isError || !data || !id) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorTitle="トレーニング機材の取得に失敗しました"
      />
    );
  }

  return <TrainingEquipmentEditForm key={id} equipment={data} id={id} />;
}
