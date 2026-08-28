'use client';

import { useCallback, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { useUnsavedChanges } from '@/app/(private)/lesson-schedules/create/_hooks/use-unsaved-changes.hook';
import { TermsActiveVersionWarning } from '@/app/(private)/terms/_components/terms-form/sections/terms-active-version-warning';
import { TermsApplicationSettingsSection } from '@/app/(private)/terms/_components/terms-form/sections/terms-application-settings-section';
import { TermsBasicInfoSection } from '@/app/(private)/terms/_components/terms-form/sections/terms-basic-info-section';
import {
  type RelatedTermsRef,
  TermsContentSection,
} from '@/app/(private)/terms/_components/terms-form/sections/terms-content-section';
import { TermsFormActions } from '@/app/(private)/terms/_components/terms-form/sections/terms-form-actions';
import { TermsDiscardDialog } from '@/app/(private)/terms/_components/terms-form/terms-discard-dialog';
import {
  MOCK_SAMPLE_PDF,
  type TermsFormMode,
  TermsFormSchema,
  type TermsFormValues,
  emptyTermsFormValues,
} from '@/app/(private)/terms/_schemas/terms-form.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useFileUpload } from '@/hooks/use-file-upload.hook';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmTermsByIdQueryKey,
  getCrmTermsQueryKey,
  patchCrmTermsByIdMutation,
  postCrmTermsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { TermsStatus, UpdateTermsBody } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

const MAX_PDF_SIZE_MB = 10;
const PDF_ACCEPTED_TYPES = ['application/pdf'] as const;
const PDF_INVALID_TYPE_MESSAGE = 'PDF形式のファイルのみアップロードできます';
const PDF_TOO_LARGE_MESSAGE = `ファイルサイズが${MAX_PDF_SIZE_MB}MBを超えています。${MAX_PDF_SIZE_MB}MB以下のファイルを選択してください`;
const PDF_UPLOAD_FAILED_MESSAGE = 'アップロードに失敗しました';

interface TermsFormProps {
  mode: TermsFormMode;
  /** Edit mode: the id of the document being updated. */
  termsId?: string;
  /** New-version mode: the source document's id (back-link target). */
  sourceId?: string;
  /** Edit mode: gates the active-version warning banner. */
  currentStatus?: TermsStatus;
  defaultValues?: Partial<TermsFormValues>;
  /** New-version mode: lineage pointers resolved by the page from the source document. */
  parentTermsId?: string | null;
  prevTermsId?: string | null;
  relatedTermsRef?: RelatedTermsRef | null;
}

export function TermsForm({
  mode,
  termsId,
  sourceId,
  currentStatus,
  defaultValues,
  parentTermsId,
  prevTermsId,
  relatedTermsRef,
}: Readonly<TermsFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isBrandTypeLocked = mode !== 'create';
  const isCopiedFieldLocked = mode === 'new-version';
  const isEditMode = mode === 'edit';

  const pageTitle =
    mode === 'edit' ? '規約編集' : mode === 'new-version' ? '新規バージョン作成' : '規約新規登録';

  const backHref =
    mode === 'edit' && termsId
      ? navigate('/terms/[id]', termsId)
      : mode === 'new-version' && sourceId
        ? navigate('/terms/[id]', sourceId)
        : navigate('/terms');

  const form = useForm<TermsFormValues>({
    resolver: zodResolver(TermsFormSchema),
    mode: 'onChange',
    defaultValues: { ...emptyTermsFormValues, ...defaultValues },
  });

  const { isDirty, dirtyFields, errors, isSubmitting } = form.formState;
  const hasSubmitErrors = form.formState.submitCount > 0 && Object.keys(errors).length > 0;

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(isDirty);

  const { uploadFile, isUploading } = useFileUpload({
    category: 'document',
    maxSizeMB: MAX_PDF_SIZE_MB,
    acceptedTypes: PDF_ACCEPTED_TYPES,
  });
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [replacingPdf, setReplacingPdf] = useState(false);

  const watchedPdfFileName = useWatch({
    control: form.control,
    name: 'pdfFileName',
  });
  const hasExistingPdf = isEditMode && !!defaultValues?.pdfFileName;
  const showExistingFileChip = hasExistingPdf && !replacingPdf;
  const attachedPdfName = watchedPdfFileName;

  const createMutation = useMutation(postCrmTermsMutation());
  const updateMutation = useMutation(patchCrmTermsByIdMutation());

  const handleReplaceClick = useCallback(() => {
    setReplacingPdf(true);
    form.setValue('pdfUrl', '', { shouldDirty: true });
    form.setValue('pdfFileName', '', { shouldDirty: true });
    form.setValue('pdfFileSize', 0, { shouldDirty: true });
  }, [form]);

  const handleCancelReplace = useCallback(() => {
    setReplacingPdf(false);
    form.setValue('pdfUrl', defaultValues?.pdfUrl ?? '', {
      shouldDirty: false,
    });
    form.setValue('pdfFileName', defaultValues?.pdfFileName ?? '', {
      shouldDirty: false,
    });
    form.setValue('pdfFileSize', defaultValues?.pdfFileSize ?? 0, {
      shouldDirty: false,
    });
    if (errors.pdfUrl) form.clearErrors('pdfUrl');
  }, [defaultValues, errors.pdfUrl, form]);

  const handlePdfSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const outcome = await uploadFile(file);
      if (!outcome.ok) {
        const message =
          outcome.reason === 'invalid_type'
            ? PDF_INVALID_TYPE_MESSAGE
            : outcome.reason === 'too_large'
              ? PDF_TOO_LARGE_MESSAGE
              : PDF_UPLOAD_FAILED_MESSAGE;
        if (outcome.reason === 'upload_failed') toast.error(message);
        form.setError('pdfUrl', { type: 'manual', message });
        return;
      }

      form.clearErrors('pdfUrl');
      form.setValue('pdfUrl', outcome.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('pdfFileName', outcome.name, { shouldDirty: true });
      form.setValue('pdfFileSize', outcome.size, { shouldDirty: true });
    },
    [form, uploadFile],
  );

  const handleSetMockPdf = useCallback(() => {
    form.clearErrors('pdfUrl');
    form.setValue('pdfUrl', MOCK_SAMPLE_PDF.url, { shouldDirty: true, shouldValidate: true });
    form.setValue('pdfFileName', MOCK_SAMPLE_PDF.fileName, { shouldDirty: true });
    form.setValue('pdfFileSize', MOCK_SAMPLE_PDF.size, { shouldDirty: true });
  }, [form]);

  const handleSubmit = form.handleSubmit(
    async (values) => {
      try {
        if (mode === 'edit' && termsId) {
          const body: UpdateTermsBody = {};
          if (dirtyFields.title) body.title = values.title;
          if (dirtyFields.version) body.version = values.version;
          if (dirtyFields.effectiveFrom) body.effectiveFrom = values.effectiveFrom;
          if (dirtyFields.effectiveTo) body.effectiveTo = values.effectiveTo || null;
          if (dirtyFields.displayOrder) body.displayOrder = values.displayOrder ?? null;
          if (dirtyFields.requiresConsent) body.requiresConsent = values.requiresConsent;
          if (dirtyFields.remarks) body.remarks = values.remarks || null;
          if (dirtyFields.pdfUrl) {
            body.pdfUrl = values.pdfUrl;
            body.pdfFileName = values.pdfFileName;
            body.pdfFileSize = values.pdfFileSize;
          }

          await updateMutation.mutateAsync({ path: { id: termsId }, body });
          toast.success('規約の変更を保存しました');
          queryClient.invalidateQueries({ queryKey: getCrmTermsQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getCrmTermsByIdQueryKey({ path: { id: termsId } }),
          });
          router.push(navigate('/terms/[id]', termsId));
          return;
        }

        const basePayload = {
          termsType: values.termsType,
          title: values.title,
          version: values.version,
          effectiveFrom: values.effectiveFrom,
          effectiveTo: values.effectiveTo || null,
          displayOrder: values.displayOrder ?? null,
          requiresConsent: values.requiresConsent,
          remarks: values.remarks || null,
          pdfUrl: values.pdfUrl,
          pdfFileName: values.pdfFileName,
          pdfFileSize: values.pdfFileSize,
          ...(mode === 'new-version' ? { parentTermsId, prevTermsId } : {}),
        };

        const results = await Promise.all(
          values.brandEnum.map((brand) =>
            createMutation.mutateAsync({
              body: { ...basePayload, brandEnum: brand },
            }),
          ),
        );

        queryClient.invalidateQueries({ queryKey: getCrmTermsQueryKey() });
        toast.success('規約を登録しました');

        if (mode === 'new-version') {
          router.push(navigate('/terms/[id]', results[0].id));
        } else {
          router.push(navigate('/terms'));
        }
      } catch {
        toast.error(mode === 'edit' ? '規約の保存に失敗しました' : '規約の登録に失敗しました');
      }
    },
    () => {
      setTimeout(() => {
        const element = document.querySelector("[aria-invalid='true']");
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    },
  );

  const handleBack = () => confirmDiscard(() => router.push(backHref));

  return (
    <Form {...form}>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col">
        <PageHeader
          breadcrumb={<BackLink label="規約文書管理に戻る" onClick={handleBack} />}
          title={pageTitle}
        />

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isEditMode && currentStatus === 'published' && <TermsActiveVersionWarning />}

          <div className="mx-auto flex max-w-240 flex-col gap-6">
            <TermsBasicInfoSection
              isBrandTypeLocked={isBrandTypeLocked}
              isCopiedFieldLocked={isCopiedFieldLocked}
            />

            <TermsApplicationSettingsSection isCopiedFieldLocked={isCopiedFieldLocked} />

            <TermsContentSection
              pdfInputRef={pdfInputRef}
              isUploading={isUploading}
              hasExistingPdf={hasExistingPdf}
              showExistingFileChip={showExistingFileChip}
              existingPdfFileName={defaultValues?.pdfFileName}
              attachedPdfName={attachedPdfName}
              onReplaceClick={handleReplaceClick}
              onCancelReplace={handleCancelReplace}
              onFileSelect={handlePdfSelect}
              onSetMockPdf={process.env.NODE_ENV === 'development' ? handleSetMockPdf : undefined}
              relatedTermsRef={relatedTermsRef}
            />

            <TermsFormActions
              hasSubmitErrors={hasSubmitErrors}
              isSubmitting={isSubmitting}
              isUploading={isUploading}
              isEditMode={isEditMode}
              isDirty={isDirty}
              onCancel={handleBack}
            />
          </div>
        </main>
      </form>

      <TermsDiscardDialog
        open={discardDialogOpen}
        onOpenChange={handleDiscardCancel}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </Form>
  );
}
