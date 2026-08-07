'use client';

import { useState } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';

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

import {
  getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey,
  getCrmTrainingEquipmentByEquipmentIdOptions,
  getCrmTrainingEquipmentByEquipmentIdQueryKey,
  getCrmTrainingEquipmentQueryKey,
  patchCrmTrainingEquipmentByEquipmentIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmTrainingEquipmentByEquipmentIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { TrainingEquipmentFormFields } from '../../_components/training-equipment-form-fields';
import {
  type TrainingEquipmentFormSubmitValues,
  type TrainingEquipmentFormValues,
  trainingEquipmentFormSchema,
} from '../../_schemas/training-equipment-form.schema';
import {
  equipmentToFormDefaults,
  trainingEquipmentFormToUpdatePayload,
} from '../../_utils/training-equipment-form.mapper';

type TrainingEquipmentDetail = NonNullable<
  GetCrmTrainingEquipmentByEquipmentIdResponse['equipment']
>;

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
  const originalToolType = equipment.tool_type;

  const form = useForm<TrainingEquipmentFormValues, unknown, TrainingEquipmentFormSubmitValues>({
    resolver: zodResolver(trainingEquipmentFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: equipmentToFormDefaults(equipment),
  });

  const { isDirty } = useFormState({ control: form.control });

  const updateMutation = useMutation({
    ...patchCrmTrainingEquipmentByEquipmentIdMutation(),
    onSuccess: (response) => {
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
      router.push(navigate('/training-equipment/[id]', response.equipment.id));
    },
    onError: () => toast.error('トレーニング機材の更新に失敗しました'),
  });

  const submitValues = (values: TrainingEquipmentFormSubmitValues) => {
    if (!isDirty) return;
    updateMutation.mutate({
      path: { equipmentId: id },
      body: trainingEquipmentFormToUpdatePayload(values),
    });
  };

  const onSubmit = (values: TrainingEquipmentFormSubmitValues) => {
    if (values.tool_type !== originalToolType) {
      setPendingValues(values);
      setToolTypeDialogOpen(true);
      return;
    }
    submitValues(values);
  };

  const handleSubmit = form.handleSubmit(onSubmit, scrollToFirstError);

  const handleCancel = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(navigate('/training-equipment/[id]', id));
  };

  const handleStoreChange = (store: { store_id: string; name: string } | null) => {
    form.setValue('store_name', store?.name ?? '', { shouldDirty: true });
  };

  const toolType = useWatch({ control: form.control, name: 'tool_type' });
  const showToolTypeWarning = toolType !== originalToolType;

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="トレーニング機材管理に戻る" href={navigate('/training-equipment')} />
        }
        title="トレーニング機材 編集"
      />

      <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="mx-auto max-w-[960px] space-y-6">
            <TrainingEquipmentFormFields
              control={form.control}
              isEdit
              currentStatus={equipment.status}
              showToolTypeWarning={showToolTypeWarning}
              onStoreChange={handleStoreChange}
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
            <AlertDialogAction
              onClick={() => router.push(navigate('/training-equipment/[id]', id))}
            >
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

  const equipment = data?.equipment;

  if (isLoading || isError || !equipment || !id) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!equipment}
        onRetry={() => refetch()}
        errorTitle="トレーニング機材の取得に失敗しました"
      />
    );
  }

  return <TrainingEquipmentEditForm key={id} equipment={equipment} id={id} />;
}
