'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
  getCrmRoutinesByIdQueryKey,
  getCrmRoutinesQueryKey,
  patchCrmRoutinesByIdMutation,
  patchCrmRoutinesByIdPublishStatusMutation,
  postCrmRoutinesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { RoutineDetail } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  type RoutineFormValues,
  createEmptyRoutineFormValues,
  mapRoutineDetailToFormValues,
  mapRoutineFormValuesToBody,
  routineFormSchema,
} from '../../_schemas/routine-form.schema';
import { RoutineFormBasicInfoSection } from './routine-form-basic-info-section';
import { RoutineFormExerciseCompositionSection } from './routine-form-exercise-composition-section';
import { RoutineFormStatusSection } from './routine-form-status-section';
import { RoutineFormThumbnailSection } from './routine-form-thumbnail-section';

type RoutineFormProps = {
  mode: 'create' | 'edit';
  defaultDetail?: RoutineDetail;
};

export function RoutineForm({ mode, defaultDetail }: RoutineFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const [discardOpen, setDiscardOpen] = useState(false);

  const isEdit = mode === 'edit';
  const routineId = defaultDetail?.id;
  const initialPublished = defaultDetail?.publishStatus === 'published';
  const pageTitle = isEdit ? 'ルーティン 編集' : 'ルーティン 新規登録';

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: defaultDetail
      ? mapRoutineDetailToFormValues(defaultDetail)
      : createEmptyRoutineFormValues(),
  });

  const publishMutation = useMutation({
    ...patchCrmRoutinesByIdPublishStatusMutation(),
  });

  const finish = (id: string) => {
    queryClient.invalidateQueries({ queryKey: getCrmRoutinesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getCrmRoutinesByIdQueryKey({ path: { id } }) });
    toast.success(isEdit ? 'ルーティンの変更を保存しました' : 'ルーティンを登録しました');
    router.push(navigate('/routines'));
  };

  const applyPublishThenFinish = (id: string, exerciseCount: number) => {
    const desiredPublished = form.getValues('isPublished') && exerciseCount > 0;
    if (desiredPublished === initialPublished) {
      finish(id);
      return;
    }
    publishMutation.mutate(
      {
        path: { id },
        body: { publishStatus: desiredPublished ? 'published' : 'unpublished' },
      },
      {
        onSuccess: () => finish(id),
        onError: () => toast.error('公開ステータスの更新に失敗しました'),
      },
    );
  };

  const createMutation = useMutation({
    ...postCrmRoutinesMutation(),
    onSuccess: (result) => {
      applyPublishThenFinish(result.routine.id, result.routine.exerciseCount);
    },
    onError: (error) => toast.error(error.error || 'ルーティンの登録に失敗しました'),
  });

  const updateMutation = useMutation({
    ...patchCrmRoutinesByIdMutation(),
    onSuccess: (result) => {
      applyPublishThenFinish(result.routine.id, result.routine.exerciseCount);
    },
    onError: (error) => toast.error(error.error || 'ルーティンの更新に失敗しました'),
  });

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  const handleSubmit = form.handleSubmit((values) => {
    const body = mapRoutineFormValuesToBody(values);
    if (isEdit && routineId) {
      updateMutation.mutate({ path: { id: routineId }, body });
    } else {
      createMutation.mutate({ body });
    }
  }, scrollToFirstError);

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(navigate('/routines'));
  };

  return (
    <Form {...form}>
      <PageHeader
        breadcrumb={<BackLink label="ルーティン管理に戻る" href={navigate('/routines')} />}
        title={pageTitle}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4"
      >
        <div className="mx-auto max-w-[960px] space-y-6">
          <RoutineFormBasicInfoSection />
          <RoutineFormThumbnailSection />
          <RoutineFormExerciseCompositionSection />
          <RoutineFormStatusSection />

          <div className="flex items-center justify-end gap-2 border-t p-4">
            {form.formState.isSubmitted &&
              (form.formState.errors.name || form.formState.errors.categoryId) && (
                <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
              )}
            <Button type="button" size="lg" variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : isEdit ? '更新' : '登録'}
            </Button>
          </div>
        </div>
      </form>

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
            <AlertDialogAction onClick={() => router.push(navigate('/routines'))}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
