'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { useUnsavedChanges } from '@/app/(private)/lesson-schedules/create/_hooks/use-unsaved-changes.hook';
import { isAllBrandsSelected } from '@/utils/app.util';
import { formatDateYYYYMMDD, parseDate } from '@/utils/date.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useImageUpload } from '@/hooks/use-image-upload.hook';

import {
  getCrmBannersByIdQueryKey,
  getCrmBannersQueryKey,
  patchCrmBannersByIdMutation,
  postCrmBannersMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { BrandEnum } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BRAND_ALL_VALUE, BannerBrandSelectValue } from '../../_constants/banner.constants';
import {
  bannerFormValuesToCreateBody,
  bannerFormValuesToUpdateBody,
} from '../../_schemas/banner-form.mapper';
import {
  BannerFormSchema,
  type BannerFormSubmitValues,
  type BannerFormValues,
  emptyBannerFormValues,
} from '../../_schemas/banner-form.schema';
import { BannerDiscardDialog } from './banner-discard-dialog';
import { BannerBasicInfoSection } from './sections/banner-basic-info-section';
import { BannerBrandSection } from './sections/banner-brand-section';
import { BannerChannelSection } from './sections/banner-channel-section';
import { BannerFormActions } from './sections/banner-form-actions';
import { BannerImageSection } from './sections/banner-image-section';
import { BannerOrderSection } from './sections/banner-order-section';
import { BannerPeriodSection } from './sections/banner-period-section';

type BannerFormMode = 'create' | 'edit';

interface BannerFormProps {
  mode: BannerFormMode;
  defaultValues?: BannerFormValues;
  bannerId?: string;
  onNavigateBack?: () => void;
}

export function BannerForm({ mode, defaultValues, bannerId, onNavigateBack }: BannerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<BannerFormValues, unknown, BannerFormSubmitValues>({
    resolver: zodResolver(BannerFormSchema) as never,
    mode: 'onChange',
    defaultValues: defaultValues ?? emptyBannerFormValues,
  });

  const formErrors = form.formState.errors;
  const hasSubmitErrors =
    form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0;
  const formIsDirty = form.formState.isDirty;
  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(formIsDirty);

  const { uploadFile, isUploading } = useImageUpload({ category: 'studio' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const watchedBrandEnum = useWatch({
    control: form.control,
    name: 'brandEnum',
  });
  const selectedBrands = useMemo(() => watchedBrandEnum ?? [], [watchedBrandEnum]);
  const watchedPeriodStart = useWatch({
    control: form.control,
    name: 'periodStart',
  });
  const watchedPeriodEnd = useWatch({
    control: form.control,
    name: 'periodEnd',
  });
  const watchedImageUrl = useWatch({ control: form.control, name: 'imageUrl' });
  const previewUrl = watchedImageUrl || null;
  const watchedWebEnabled = useWatch({
    control: form.control,
    name: 'webEnabled',
  });
  const watchedMobileEnabled = useWatch({
    control: form.control,
    name: 'mobileEnabled',
  });

  const setBrandEnum = useCallback(
    (next: BrandEnum[]) => {
      form.setValue('brandEnum', next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const toggleBrand = useCallback(
    (id: BannerBrandSelectValue) => {
      if (id === BRAND_ALL_VALUE) {
        setBrandEnum(Object.values(BrandEnum));
        return;
      }

      const isAllSelected = isAllBrandsSelected(selectedBrands);
      const exists = !isAllSelected && selectedBrands.includes(id);
      const next = exists
        ? selectedBrands.filter((brand) => brand !== id)
        : isAllSelected
          ? [id]
          : [...selectedBrands, id];

      if (next.length > 0) {
        setBrandEnum(next);
      }
    },
    [selectedBrands, setBrandEnum],
  );

  const handleChannelChange = useCallback(
    (field: 'webEnabled' | 'mobileEnabled', value: boolean) => {
      form.setValue(field, value, { shouldDirty: true });
    },
    [form],
  );

  const handleDateChange = useCallback(
    (field: 'periodStart' | 'periodEnd', date: Date | undefined) => {
      if (field === 'periodStart') {
        form.setValue('periodStart', formatDateYYYYMMDD(date, ''), {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      form.setValue('periodEnd', formatDateYYYYMMDD(date, '') || null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const navigateToList = useCallback(() => {
    router.push(navigate('/banners'));
  }, [router]);

  const handleBack = useCallback(() => {
    confirmDiscard(onNavigateBack ?? navigateToList);
  }, [confirmDiscard, navigateToList, onNavigateBack]);

  const invalidateAndNavigate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getCrmBannersQueryKey() });
    navigateToList();
  }, [queryClient, navigateToList]);

  const createMutation = useMutation({
    ...postCrmBannersMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'バナーを登録しました');
      invalidateAndNavigate();
    },
    onError: () => {
      toast.error('バナーの作成に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...patchCrmBannersByIdMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'バナーの変更を保存しました');
      if (bannerId) {
        queryClient.invalidateQueries({
          queryKey: getCrmBannersByIdQueryKey({ path: { id: bannerId } }),
        });
      }
      invalidateAndNavigate();
    },
    onError: () => {
      toast.error('バナーの更新に失敗しました');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleFileSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const url = await uploadFile(file);
      if (url) {
        form.setValue('imageUrl', url, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadFile, form],
  );

  const handleSubmit = form.handleSubmit(
    (values) => {
      if (mode === 'create') {
        createMutation.mutate({ body: bannerFormValuesToCreateBody(values) });
        return;
      }

      if (bannerId) {
        updateMutation.mutate({
          body: bannerFormValuesToUpdateBody(values),
          path: { id: bannerId },
        });
      }
    },
    () => {
      setTimeout(() => {
        const element = document.querySelector("[aria-invalid='true']");
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    },
  );

  const periodStartDate = useMemo(
    () => parseDate(watchedPeriodStart) ?? undefined,
    [watchedPeriodStart],
  );
  const periodEndDate = useMemo(() => parseDate(watchedPeriodEnd) ?? undefined, [watchedPeriodEnd]);

  return (
    <div className="bg-background flex-1 overflow-y-auto px-6 py-4">
      <div className="mx-auto flex max-w-240 flex-col gap-6">
        <BannerBasicInfoSection
          formErrors={formErrors}
          defaultValues={defaultValues}
          register={form.register}
        />

        <BannerImageSection
          formErrors={formErrors}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          previewUrl={previewUrl}
        />

        <BannerBrandSection
          formErrors={formErrors}
          selectedBrands={selectedBrands}
          toggleBrand={toggleBrand}
        />

        <BannerChannelSection
          webEnabled={watchedWebEnabled ?? true}
          mobileEnabled={watchedMobileEnabled ?? true}
          onChannelChange={handleChannelChange}
        />

        <BannerPeriodSection
          formErrors={formErrors}
          periodStartDate={periodStartDate}
          periodEndDate={periodEndDate}
          onDateChange={handleDateChange}
        />

        <BannerOrderSection defaultValues={defaultValues} register={form.register} />

        <BannerFormActions
          hasSubmitErrors={hasSubmitErrors}
          isSubmitting={isSubmitting}
          isUploading={isUploading}
          onCancel={handleBack}
          onSubmit={handleSubmit}
        />
      </div>

      <BannerDiscardDialog
        open={discardDialogOpen}
        onOpenChange={handleDiscardCancel}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </div>
  );
}
