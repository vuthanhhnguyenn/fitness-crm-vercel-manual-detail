'use client';

import { useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
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
  getCrmTrainingEquipmentQueryKey,
  postCrmTrainingEquipmentMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { TrainingEquipmentFormFields } from '../_components/training-equipment-form-fields';
import {
  type TrainingEquipmentFormSubmitValues,
  type TrainingEquipmentFormValues,
  trainingEquipmentFormSchema,
} from '../_schemas/training-equipment-form.schema';
import {
  emptyTrainingEquipmentFormDefaults,
  trainingEquipmentFormToCreatePayload,
} from '../_utils/training-equipment-form.mapper';

export default function TrainingEquipmentCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const [discardOpen, setDiscardOpen] = useState(false);

  const form = useForm<TrainingEquipmentFormValues, unknown, TrainingEquipmentFormSubmitValues>({
    resolver: zodResolver(trainingEquipmentFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: emptyTrainingEquipmentFormDefaults,
  });

  const { isDirty } = useFormState({ control: form.control });

  const createMutation = useMutation({
    ...postCrmTrainingEquipmentMutation(),
    onSuccess: (created) => {
      toast.success('トレーニング機材を登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
      router.push(navigate('/training-equipment/[id]', created.id));
    },
    onError: () => toast.error('トレーニング機材の登録に失敗しました'),
  });

  const onSubmit = (values: TrainingEquipmentFormSubmitValues) => {
    createMutation.mutate({ body: trainingEquipmentFormToCreatePayload(values) });
  };

  const handleSubmit = form.handleSubmit(onSubmit, scrollToFirstError);

  const handleCancel = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(navigate('/training-equipment'));
  };

  const handleStoreChange = (store: { store_id: string; name: string } | null) => {
    form.setValue('store_name', store?.name ?? '', { shouldDirty: true });
  };

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="トレーニング機材管理に戻る" href={navigate('/training-equipment')} />
        }
        title="トレーニング機材 新規登録"
      />

      <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="mx-auto max-w-[960px] space-y-6">
            <TrainingEquipmentFormFields control={form.control} onStoreChange={handleStoreChange} />

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <Button type="button" size="lg" variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
              <Button type="submit" size="lg" disabled={createMutation.isPending}>
                {createMutation.isPending ? '登録中...' : '登録'}
              </Button>
            </div>
          </form>
        </Form>
      </main>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>入力内容は保存されません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(navigate('/training-equipment'))}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
