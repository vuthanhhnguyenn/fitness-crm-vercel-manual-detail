'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  patchCrmLessonContentsByIdMutation,
  postCrmLessonContentsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import type {
  LessonFormInput,
  LessonFormMode,
  LessonFormValues,
} from '../../_schemas/lesson-form.schema';
import { LessonFormSchema } from '../../_schemas/lesson-form.schema';
import { LessonFormBasicInfo } from './lesson-form-basic-info';
import { LessonFormConfirmDialog } from './lesson-form-confirm-dialog';
import { LessonFormDescription } from './lesson-form-description';
import { LessonFormImages } from './lesson-form-images';
import { LessonFormNotes } from './lesson-form-notes';
import { LessonFormRestrictions } from './lesson-form-restrictions';
import { LessonFormStatus } from './lesson-form-status';

interface LessonFormProps {
  mode: LessonFormMode;
  defaultValues?: Partial<LessonFormValues>;
  lessonId?: string;
}

function formValuesToApiBody(values: Partial<LessonFormValues>) {
  return {
    name: values.name!,
    lesson_type: values.lessonType!,
    brand: values.brand!,
    duration: values.duration!,
    pricing_type:
      values.pricingType === 'per_use'
        ? ('paid' as const)
        : values.pricingType === 'free'
          ? ('included' as const)
          : ('included' as const),
    per_use_fee: values.pricingType === 'per_use' ? (values.perUseFee ?? null) : null,
    images: (values.images ?? []).map((image) => ({
      order: image.order,
      url: image.url,
    })),
    restricted_main_contracts: values.restrictedMainContracts,
    restricted_option_contracts: values.restrictedOptionContracts,
    description: values.description || '',
    internal_memo: values.notes || '',
    status: values.status!,
  };
}

export function LessonForm({ mode, defaultValues, lessonId }: LessonFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitValues, setSubmitValues] = useState<Partial<LessonFormValues> | null>(null);
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<LessonFormInput, unknown, LessonFormValues>({
    resolver: zodResolver(LessonFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      lessonType: 'studio',
      perUseFee: null,
      restrictedMainContracts: [],
      restrictedOptionContracts: [],
      images: [],
      description: '',
      notes: '',
      status: 'active',
      ...defaultValues,
    },
  });

  const createMutation = useMutation({
    ...postCrmLessonContentsMutation(),
    onSuccess: () => {
      toast.success('レッスンを登録しました');
      router.push(navigate('/lessons'));
    },
    onError: () => {
      toast.error('レッスンの登録に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...patchCrmLessonContentsByIdMutation(),
    onSuccess: () => {
      toast.success('レッスンの変更を保存しました');
      router.push(navigate('/lessons'));
    },
    onError: () => {
      toast.error('レッスンの保存に失敗しました');
    },
  });

  const errors = form.formState.errors;
  const hasErrors = Object.keys(errors).length > 0;

  // const pageTitle = isEdit
  //   ? defaultValues?.lessonType === 'personal'
  //     ? 'パーソナルトレーニング編集'
  //     : 'スタジオレッスン編集'
  //   : '新規レッスン作成';

  const submitLabel = isEdit ? '変更を保存する' : '入力内容を確認する';

  const handleSubmit = () => {
    form.handleSubmit(
      (values) => {
        setSubmitValues(values);
        setConfirmOpen(true);
      },
      () => {
        // Validation failed - errors are rendered inline by FormMessage
      },
    )();
  };

  const handleConfirm = () => {
    if (!submitValues) return;
    setConfirmOpen(false);
    const body = formValuesToApiBody(submitValues);
    if (isEdit && lessonId) {
      updateMutation.mutate({ body, path: { id: lessonId } });
    } else {
      createMutation.mutate({ body });
    }
  };

  const onInvalid = () => {
    scrollToFirstError();
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit, onInvalid)}>
        <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto max-w-[960px]">
            <div className="space-y-6">
              {isEdit && (
                <Alert className="border-warning/50 bg-warning/15">
                  <AlertTriangle className="text-warning size-4" />
                  <AlertDescription className="text-muted-foreground text-xs">
                    料金や制限条件を変更すると、予約済みの会員にも影響する場合があります。
                  </AlertDescription>
                </Alert>
              )}
              <LessonFormBasicInfo />
              <LessonFormRestrictions />
              <LessonFormImages />
              <LessonFormDescription />
              <LessonFormNotes />
              <LessonFormStatus />
              <div className="flex items-center justify-end gap-2 border-t p-4">
                <Button size="lg" variant="outline" type="button" onClick={() => router.back()}>
                  キャンセル
                </Button>
                <Button
                  size="lg"
                  type="button"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {submitLabel}
                </Button>
              </div>
              {hasErrors && (
                <div className="flex justify-end">
                  <p className="text-destructive text-xs">
                    入力内容に不備があります。エラー表示の項目をご確認ください。
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <LessonFormConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          mode={mode}
          values={submitValues ?? {}}
          onConfirm={handleConfirm}
        />
      </form>
    </Form>
  );
}
