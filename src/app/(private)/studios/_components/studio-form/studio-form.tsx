'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';

import {
  getCrmStoresOptions,
  getCrmStudiosByIdQueryKey,
  getCrmStudiosQueryKey,
  postCrmStudiosMutation,
  putCrmStudiosByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import type { StudioFormInput, StudioFormMode, StudioFormValues } from '../studio-form.schema';
import { StudioFormSchema } from '../studio-form.schema';
import { SpaceLayoutEditor } from './space-layout-editor';
import { StudioFormBasicInfo } from './studio-form-basic-info';
import { StudioFormConfirmDialog } from './studio-form-confirm-dialog';
import { StudioFormEquipment } from './studio-form-equipment';
import { StudioFormImages } from './studio-form-images';
import { StudioFormNotes } from './studio-form-notes';
import { StudioFormStatus } from './studio-form-status';

interface StudioFormProps {
  mode: StudioFormMode;
  defaultValues?: Partial<StudioFormValues>;
  studioId?: string;
  assignedLessonCount?: number;
}

function formValuesToApiBody(values: Partial<StudioFormValues>) {
  return {
    name: values.name!,
    store_id: values.storeId!,
    studio_type: values.studioType!,
    capacity: values.capacity!,
    buffer_value: values.bufferValue ?? 0,
    operating_hours: values.operatingHours!,
    equipment_notes: values.equipmentNotes || null,
    internal_notes: values.internalNotes || null,
    status: values.status!,
    images: (values.images ?? []).map((image, index) => ({
      url: image.url,
      sort_order: index,
    })),
    layout: values.layout
      ? {
          rows: values.layout.rows,
          columns: values.layout.columns,
          cells: values.layout.cells,
        }
      : undefined,
  };
}

export function StudioForm({
  mode,
  defaultValues,
  studioId,
  assignedLessonCount,
}: StudioFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitValues, setSubmitValues] = useState<Partial<StudioFormValues> | null>(null);
  const scrollToFirstError = useScrollToFirstError();
  const queryClient = useQueryClient();

  const { data: storesData } = useQuery(getCrmStoresOptions({ query: { limit: 100 } }));

  const storeName = submitValues?.storeId
    ? (storesData?.stores ?? []).find((s) => s.id === submitValues.storeId)?.name
    : undefined;

  const form = useForm<StudioFormInput, unknown, StudioFormValues>({
    resolver: zodResolver(StudioFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      storeId: '',
      name: '',
      studioType: 'normal',
      operatingHours: '',
      capacity: undefined as unknown as number,
      bufferValue: 0,
      equipmentNotes: '',
      internalNotes: '',
      status: 'active',
      images: [],
      ...defaultValues,
    },
  });

  const createMutation = useMutation({
    ...postCrmStudiosMutation(),
    onSuccess: () => {
      toast.success('スタジオを登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmStudiosQueryKey() });
      router.push(navigate('/studios'));
    },
    onError: (error: Error) => {
      toast.error(error.message || 'スタジオの登録に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...putCrmStudiosByIdMutation(),
    onSuccess: () => {
      toast.success('スタジオの変更を保存しました');
      queryClient.invalidateQueries({ queryKey: getCrmStudiosQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmStudiosByIdQueryKey({ path: { id: studioId! } }),
      });
      router.push(navigate('/studios'));
    },
    onError: (error: Error) => {
      toast.error(error.message || 'スタジオの保存に失敗しました');
    },
  });

  const hasErrors = Object.keys(form.formState.errors).length > 0;

  const submitLabel = isEdit ? '変更を保存する' : '入力内容を確認する';

  const handleSubmit = () => {
    form.handleSubmit(
      (values) => {
        setSubmitValues(values);
        setConfirmOpen(true);
      },
      () => {
        // Validation failed
      },
    )();
  };

  const handleConfirm = () => {
    if (!submitValues) return;
    setConfirmOpen(false);
    const body = formValuesToApiBody(submitValues);
    if (isEdit && studioId) {
      updateMutation.mutate({ body, path: { id: studioId } });
    } else {
      createMutation.mutate({ body });
    }
  };

  const onInvalid = () => {
    scrollToFirstError();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const showWarning = isEdit && (assignedLessonCount ?? 0) > 0;

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit, onInvalid)}>
        <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {showWarning && (
            <Alert className="border-warning/50 bg-warning/15 mx-auto mb-6 max-w-[960px]">
              <AlertTriangle className="text-warning size-4" />
              <AlertDescription className="text-muted-foreground text-xs">
                料金や制限条件を変更すると、予約済みの会員にも影響する場合があります。
              </AlertDescription>
            </Alert>
          )}
          <div className="mx-auto flex max-w-[960px] gap-6">
            {/* Left column – form fields */}
            <div className="min-w-0 flex-1 space-y-6">
              <Card>
                <CardContent className="px-4">
                  <StudioFormBasicInfo />
                  <div className="space-y-4">
                    <StudioFormEquipment />
                    <StudioFormImages />
                    <StudioFormNotes />
                  </div>
                </CardContent>
              </Card>
              <StudioFormStatus />
            </div>

            {/* Right column – space layout editor */}
            <SpaceLayoutEditor />
          </div>

          {/* Action buttons */}
          <div className="mx-auto mt-6 flex max-w-[960px] items-center justify-end gap-2 border-t px-4 py-4">
            <Button size="lg" variant="outline" type="button" onClick={() => router.back()}>
              キャンセル
            </Button>
            <Button size="lg" type="button" onClick={handleSubmit} disabled={isPending}>
              {submitLabel}
            </Button>
          </div>
          {hasErrors && (
            <div className="mx-auto flex max-w-[960px] justify-end px-4">
              <p className="text-destructive text-xs">
                入力内容に不備があります。エラー表示の項目をご確認ください。
              </p>
            </div>
          )}
        </main>

        <StudioFormConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          mode={mode}
          values={submitValues ?? {}}
          storeName={storeName}
          onConfirm={handleConfirm}
        />
      </form>
    </Form>
  );
}
