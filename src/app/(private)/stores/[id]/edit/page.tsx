'use client';

import { useEffect, useMemo } from 'react';
import { useForm, useFormState } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmStoresByIdOptions,
  getCrmStoresByIdQueryKey,
  getCrmStoresQueryKey,
  patchCrmStoresByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { StoreForm } from '../../_components/store-form';
import {
  type StoreFormSubmitValues,
  type StoreFormValues,
  storeFormSchema,
} from '../../_schemas/store-form.schema';

export default function StoreEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const scrollToFirstError = useScrollToFirstError();

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const store = data?.store;

  const defaultValues = useMemo<StoreFormValues>(() => {
    return {
      name: store?.name ?? '',
      brand: store?.brand ?? 'joyfit24',
      operating_company_name: store?.operating_company_name ?? '',
      area: store?.area ?? '',
      postal_code: store?.postal_code ?? '',
      prefecture: store?.prefecture ?? '',
      address: store?.address ?? '',
      email: store?.email ?? '',
      phone: store?.phone ?? '',
      club_code: store?.club_code ?? '',
      accounting_code: store?.accounting_code ?? '',
      is_fc: Boolean(store?.fc_company_id),
      status: store?.status ?? 'operating',
      interview_url: store?.interview_url ?? '',
      google_map_url: store?.google_map_url ?? '',
      x_url: store?.x_url ?? '',
      instagram_url: store?.instagram_url ?? '',
      line_url: store?.line_url ?? '',
      facebook_url: store?.facebook_url ?? '',
      youtube_url: store?.youtube_url ?? '',
      store_photos: store?.store_photos ?? [],
      floor_map_url: store?.floor_map_url ?? '',
    };
  }, [store]);

  const form = useForm<StoreFormValues, unknown, StoreFormSubmitValues>({
    resolver: zodResolver(storeFormSchema) as any,
    mode: 'onSubmit',
    defaultValues,
  });

  useEffect(() => {
    if (!store) return;
    form.reset(defaultValues);
  }, [defaultValues, form, store]);

  const { isDirty } = useFormState({ control: form.control });

  const patchMutation = useMutation({
    ...patchCrmStoresByIdMutation(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCrmStoresByIdQueryKey({ path: { id } }) }),
        queryClient.invalidateQueries({
          queryKey: getCrmStoresQueryKey(),
          refetchType: 'all',
        }),
      ]);
      toast.success('店舗情報を更新しました');
      router.push(navigate('/stores'));
    },
    onError: () => {
      toast.error('店舗情報の更新に失敗しました');
    },
  });

  const onSubmit = (values: StoreFormSubmitValues) => {
    const { area, club_code, operating_company_name, ...rest } = values;
    patchMutation.mutate({
      path: { id },
      body: {
        ...rest,
        operating_company_name: operating_company_name || undefined,
        ...(area !== undefined ? { area } : {}),
        ...(club_code !== undefined ? { club_code } : {}),
      },
    });
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (!isDirty) return;
    onSubmit(values);
  }, scrollToFirstError);

  if (isLoading || isError || !store) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!store}
        onRetry={() => refetch()}
        errorTitle="店舗情報の取得に失敗しました"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[{ url: navigate('/stores'), label: '店舗管理' }, { label: '店舗編集' }]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-28">
        <div className="py-4">
          <h1 className="text-xl font-bold">店舗編集</h1>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <StoreForm />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(navigate('/stores'))}>
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={!isDirty || patchMutation.isPending}
            onClick={handleSubmit}
          >
            {patchMutation.isPending ? '保存中...' : '保存する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
