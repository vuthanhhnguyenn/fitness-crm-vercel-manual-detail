'use client';

import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

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
import { Form } from '@/components/ui/form';

import {
  getCrmLessonSchedulesQueryKey,
  postCrmLessonSchedulesCreateMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { PostCrmLessonSchedulesCreateError } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LessonScheduleCreateForm } from './_components/lesson-schedule-create-form';
import { useLessonScheduleForm } from './_hooks/use-lesson-schedule-form.hook';
import { lessonScheduleFormValuesToRequestBody } from './_schemas/lesson-schedule-form.mapper';
import type { LessonScheduleFormSubmitValues } from './_schemas/lesson-schedule-form.schema';

export default function LessonScheduleCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useLessonScheduleForm();

  const createMutation = useMutation({
    ...postCrmLessonSchedulesCreateMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'スケジュールを登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesQueryKey() });
      router.push(navigate('/lesson-schedules'));
    },
    onError: (err: PostCrmLessonSchedulesCreateError) => {
      const message =
        'error' in err && typeof err.error === 'string'
          ? err.error
          : 'スケジュールの作成に失敗しました';
      toast.error(message);
    },
  });

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(form.formState.isDirty);

  const onSubmit = (values: LessonScheduleFormSubmitValues) => {
    createMutation.mutate({ body: lessonScheduleFormValuesToRequestBody(values) });
  };

  const onInvalid = () => {
    scrollToFirstError();
  };

  const handleCancel = () => {
    confirmDiscard(() => router.push(navigate('/lesson-schedules')));
  };

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="スケジュール管理に戻る" href={navigate('/lesson-schedules')} />
        }
        title="スケジュール 新規登録"
      />
      <div className="px-6 py-4">
        <Form {...form}>
          <form className="mx-auto max-w-[960px]" onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
            <LessonScheduleCreateForm
              isSubmitting={createMutation.isPending}
              hasSubmitError={!form?.formState?.isValid && form?.formState?.isSubmitted}
              onCancel={handleCancel}
            />
          </form>
        </Form>
      </div>

      <AlertDialog open={discardDialogOpen} onOpenChange={handleDiscardCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              未保存の変更はすべて失われます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardCancel}>編集を続ける</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>破棄する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
