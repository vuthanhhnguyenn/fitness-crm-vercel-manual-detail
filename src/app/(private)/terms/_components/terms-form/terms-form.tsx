'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { useFileUpload } from '@/hooks/use-file-upload.hook';
import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

import { PageHeader } from '@/components/common/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  getCrmTermsByIdQueryKey,
  getCrmTermsQueryKey,
  patchCrmTermsByIdMutation,
  postCrmTermsByIdVersionsMutation,
  postCrmTermsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { PatchCrmTermsByIdData } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { getTermsPdfS3Key } from '../../_schemas/terms-form.mapper';
import {
  type TermsFormMode,
  TermsFormSchema,
  type TermsFormValues,
  emptyTermsFormValues,
} from '../../_schemas/terms-form.schema';
import { TermsFormBasics } from './terms-form-basics';
import { TermsFormContent } from './terms-form-content';

const PDF_ACCEPTED_TYPES = ['application/pdf'] as const;

interface TermsFormProps {
  mode: TermsFormMode;
  defaultValues?: Partial<TermsFormValues>;
  termsId?: string;
  sourceId?: string;
  showActiveVersionWarning?: boolean;
  relatedTermsRef?: {
    title: string;
    version: string;
  } | null;
}

interface TermsFormActionsProps {
  hasSubmitErrors: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  isEditMode: boolean;
  isDirty: boolean;
  onCancel: () => void;
}

function ActiveVersionWarning() {
  return (
    <Alert className="border-warning/50 bg-warning/15">
      <AlertTriangle className="text-warning size-4" />
      <AlertDescription className="text-xs">
        適用中の規約を変更すると、同意済みの会員にも影響します。通常は新バージョンの作成を推奨します。
      </AlertDescription>
    </Alert>
  );
}

function TermsFormActions({
  hasSubmitErrors,
  isSubmitting,
  isUploading,
  isEditMode,
  isDirty,
  onCancel,
}: Readonly<TermsFormActionsProps>) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t p-4">
      {hasSubmitErrors ? (
        <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
      ) : null}
      <Button type="button" size="lg" variant="outline" disabled={isSubmitting} onClick={onCancel}>
        キャンセル
      </Button>
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || isUploading || (isEditMode && !isDirty)}
      >
        {isEditMode ? '保存する' : '登録する'}
      </Button>
    </div>
  );
}

interface DiscardChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function DiscardChangesDialog({
  open,
  onOpenChange,
  onCancel,
  onConfirm,
}: Readonly<DiscardChangesDialogProps>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            未保存の変更はすべて失われます。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>編集を続ける</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>破棄する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function TermsForm({
  mode,
  defaultValues = emptyTermsFormValues,
  termsId,
  sourceId,
  showActiveVersionWarning = false,
  relatedTermsRef,
}: Readonly<TermsFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const isEdit = mode === 'edit';
  const isNewVersion = mode === 'new-version';
  const form = useForm<TermsFormValues>({
    resolver: zodResolver(TermsFormSchema),
    mode: 'onChange',
    defaultValues: { ...emptyTermsFormValues, ...defaultValues },
  });
  const {
    dirtyFields,
    errors,
    isDirty,
    isSubmitting: isFormSubmitting,
    submitCount,
  } = form.formState;
  const selectedPdfFileName = useWatch({
    control: form.control,
    name: 'pdfFileName',
  });
  const scrollToFirstError = useScrollToFirstError();
  const { confirmDiscard, discardDialogOpen, handleDiscardCancel, handleDiscardConfirm } =
    useUnsavedChanges(isDirty);
  const { uploadFile, isUploading } = useFileUpload({
    category: 'document',
    maxSizeMB: 10,
    acceptedTypes: PDF_ACCEPTED_TYPES,
  });
  const createMutation = useMutation(postCrmTermsMutation());
  const updateMutation = useMutation(patchCrmTermsByIdMutation());
  const createVersionMutation = useMutation(postCrmTermsByIdVersionsMutation());

  const [isReplacingPdf, setIsReplacingPdf] = useState(false);
  const existingPdfFileName = defaultValues?.pdfFileName;
  const hasExistingPdf = isEdit && Boolean(existingPdfFileName);
  const showExistingPdf = hasExistingPdf && !isReplacingPdf;
  const hasSubmitErrors = submitCount > 0 && Object.keys(errors).length > 0;
  const isSubmitting =
    isFormSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    createVersionMutation.isPending;
  const detailId = termsId ?? sourceId;
  const backHref = detailId ? navigate('/terms/[id]', detailId) : navigate('/terms');

  const invalidateTerms = useCallback(
    (id?: string) => {
      queryClient.invalidateQueries({ queryKey: getCrmTermsQueryKey() });
      if (id) {
        queryClient.invalidateQueries({ queryKey: getCrmTermsByIdQueryKey({ path: { id } }) });
      }
    },
    [queryClient],
  );

  const handleReplacePdf = useCallback(() => {
    setIsReplacingPdf(true);
    form.setValue('pdfUrl', '', { shouldDirty: true, shouldValidate: true });
    form.setValue('pdfFileName', '', { shouldDirty: true });
    form.setValue('pdfFileSize', 0, { shouldDirty: true });
  }, [form]);

  const handleCancelReplacePdf = useCallback(() => {
    setIsReplacingPdf(false);
    form.resetField('pdfUrl', {
      defaultValue: defaultValues?.pdfUrl ?? emptyTermsFormValues.pdfUrl,
    });
    form.resetField('pdfFileName', {
      defaultValue: defaultValues?.pdfFileName ?? emptyTermsFormValues.pdfFileName,
    });
    form.resetField('pdfFileSize', {
      defaultValue: defaultValues?.pdfFileSize ?? emptyTermsFormValues.pdfFileSize,
    });
  }, [defaultValues, form]);

  const handleFileSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const outcome = await uploadFile(file);
      if (!outcome.ok) {
        const message =
          outcome.reason === 'invalid_type'
            ? 'PDF形式のファイルのみアップロードできます。'
            : outcome.reason === 'too_large'
              ? 'ファイルサイズは10MB以下にしてください。'
              : 'PDFのアップロードに失敗しました。';
        form.setError('pdfUrl', { type: 'manual', message });
        if (outcome.reason === 'upload_failed') toast.error(message);
        return;
      }

      form.clearErrors('pdfUrl');
      form.setValue('pdfUrl', outcome.url, { shouldDirty: true, shouldValidate: true });
      form.setValue('pdfFileName', outcome.name, { shouldDirty: true, shouldValidate: true });
      form.setValue('pdfFileSize', outcome.size, { shouldDirty: true, shouldValidate: true });
    },
    [form, uploadFile],
  );

  const submit = useCallback(
    async (values: TermsFormValues) => {
      const pdfS3Key = getTermsPdfS3Key(values.pdfUrl);
      if (!pdfS3Key) {
        form.setError('pdfUrl', { type: 'manual', message: 'PDFファイルを選択してください。' });
        scrollToFirstError();
        return;
      }

      const commonBody = {
        title: values.title.trim(),
        version: values.version.trim(),
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo,
        displayOrder: values.displayOrder === null ? null : String(values.displayOrder),
        requiresConsent: values.requiresConsent,
        remarks: values.remarks?.trim() || null,
        pdfS3Key,
        pdfUrl: values.pdfUrl,
        pdfFileName: values.pdfFileName,
      };

      const { termsType } = values;
      if (values.brandEnum.length === 0 || !termsType) {
        scrollToFirstError();
        return;
      }

      if (mode === 'create') {
        try {
          await Promise.all(
            values.brandEnum.map((brandEnum) =>
              createMutation.mutateAsync({
                body: { ...commonBody, brandEnum, termsType },
              }),
            ),
          );
          invalidateTerms();
          toast.success('規約を登録しました。');
          router.push(navigate('/terms'));
        } catch {
          toast.error('規約の登録に失敗しました。');
        }
        return;
      }

      if (mode === 'edit' && termsId) {
        const body: NonNullable<PatchCrmTermsByIdData['body']> = {};
        if (dirtyFields.title) body.title = commonBody.title;
        if (dirtyFields.version) body.version = commonBody.version;
        if (dirtyFields.effectiveFrom) body.effectiveFrom = commonBody.effectiveFrom;
        if (dirtyFields.effectiveTo) body.effectiveTo = commonBody.effectiveTo;
        if (dirtyFields.displayOrder) body.displayOrder = commonBody.displayOrder;
        if (dirtyFields.requiresConsent) body.requiresConsent = commonBody.requiresConsent;
        if (dirtyFields.remarks) body.remarks = commonBody.remarks;
        if (dirtyFields.pdfUrl || dirtyFields.pdfFileName) {
          body.pdfS3Key = commonBody.pdfS3Key;
          body.pdfUrl = commonBody.pdfUrl;
          body.pdfFileName = commonBody.pdfFileName;
        }

        updateMutation.mutate(
          { path: { id: termsId }, body },
          {
            onSuccess: () => {
              invalidateTerms(termsId);
              toast.success('規約の変更を保存しました。');
              router.push(navigate('/terms/[id]', termsId));
            },
            onError: () => toast.error('規約の保存に失敗しました。'),
          },
        );
        return;
      }

      if (mode === 'new-version' && sourceId) {
        createVersionMutation.mutate(
          { path: { id: sourceId }, body: commonBody },
          {
            onSuccess: (response) => {
              invalidateTerms(sourceId);
              invalidateTerms(response.id);
              toast.success('新しいバージョンを登録しました。');
              router.push(navigate('/terms/[id]', response.id));
            },
            onError: () => toast.error('新しいバージョンの登録に失敗しました。'),
          },
        );
      }
    },
    [
      createMutation,
      createVersionMutation,
      dirtyFields,
      form,
      invalidateTerms,
      mode,
      router,
      scrollToFirstError,
      sourceId,
      termsId,
      updateMutation,
    ],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            onClick={() => confirmDiscard(() => router.push(backHref))}
          >
            <ChevronLeft className="size-3" />
            規約文書管理に戻る
          </button>
        }
        title={isEdit ? '規約編集' : isNewVersion ? '新規バージョン作成' : '規約新規登録'}
      />
      <main className="flex-1 overflow-auto px-6 py-4">
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(submit, scrollToFirstError)}
            className="mx-auto flex w-full max-w-240 flex-col gap-6"
          >
            {showActiveVersionWarning ? <ActiveVersionWarning /> : null}
            <TermsFormBasics
              lockBrandAndType={mode !== 'create'}
              lockTitle={isNewVersion}
              lockDisplayOrderAndConsent={isNewVersion}
            />
            <TermsFormContent
              pdfInputRef={pdfInputRef}
              isUploading={isUploading}
              hasExistingPdf={hasExistingPdf}
              showExistingPdf={showExistingPdf}
              existingPdfFileName={existingPdfFileName}
              selectedPdfFileName={selectedPdfFileName}
              onReplacePdf={handleReplacePdf}
              onCancelReplacePdf={handleCancelReplacePdf}
              onFileSelect={handleFileSelect}
              relatedTermsRef={relatedTermsRef}
            />
            <TermsFormActions
              hasSubmitErrors={hasSubmitErrors}
              isSubmitting={isSubmitting}
              isUploading={isUploading}
              isEditMode={isEdit}
              isDirty={isDirty}
              onCancel={() => confirmDiscard(() => router.push(backHref))}
            />
          </form>
        </Form>
      </main>
      <DiscardChangesDialog
        open={discardDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDiscardCancel();
        }}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </div>
  );
}
