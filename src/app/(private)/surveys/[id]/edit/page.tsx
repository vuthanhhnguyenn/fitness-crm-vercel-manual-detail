'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { SearchableSelect } from '@/components/common/searchable-select';
import { Form } from '@/components/ui/form';

import {
  getCrmStoresOptions,
  getCrmSurveysByIdOptions,
  getCrmSurveysByIdQueryKey,
  getCrmSurveysByIdStoresByStoreIdVisibilityQueryKey,
  getCrmSurveysOptions,
  getCrmSurveysQueryKey,
  putCrmSurveysByIdMutation,
  putCrmSurveysByIdStoresByStoreIdVisibilityMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { Options } from '@/lib/api/sdk.gen';
import type {
  PutCrmSurveysByIdData,
  PutCrmSurveysByIdError,
  PutCrmSurveysByIdResponse,
} from '@/lib/api/types.gen';
import type { GetCrmSurveysResponse, SurveyStoreVisibility } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { SurveyForm } from '../../_components/survey-form';
import {
  type SurveyFormSubmitValues,
  type SurveyFormValues,
  mapSurveyDetailToFormValues,
  mapSurveyFormValuesToPayload,
  surveyFormSchema,
} from '../../_schemas/survey-form.schema';

type SurveyStoreOption = { id: string; name: string; store_id: string };

function SurveyEditForm({
  id,
  defaultValues,
  existingSurveys,
  storeId,
  storeOptions,
  selectedStore,
  onStoreChange,
}: Readonly<{
  id: string;
  defaultValues: SurveyFormValues;
  existingSurveys: GetCrmSurveysResponse['surveys'];
  storeId: string | null;
  storeOptions: SurveyStoreOption[];
  selectedStore: SurveyStoreOption | null;
  onStoreChange: (storeId: string) => void;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<SurveyFormValues, unknown, SurveyFormSubmitValues>({
    resolver: zodResolver(surveyFormSchema) as never,
    mode: 'onChange',
    defaultValues,
  });

  const updateMutation = useMutation<
    PutCrmSurveysByIdResponse,
    PutCrmSurveysByIdError,
    Options<PutCrmSurveysByIdData>
  >({
    ...putCrmSurveysByIdMutation(),
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'アンケートの更新に失敗しました';
      toast.error(message);
    },
  });

  const visibilityMutation = useMutation({
    ...putCrmSurveysByIdStoresByStoreIdVisibilityMutation(),
    onError: () => {
      toast.error('アンケートの表示設定の更新に失敗しました');
    },
  });

  const handleSubmit = async (
    values: SurveyFormSubmitValues,
    visibility: SurveyStoreVisibility['questions'] | null,
  ) => {
    try {
      const response = await updateMutation.mutateAsync({
        path: { id },
        body: mapSurveyFormValuesToPayload(values) as never,
      });

      if (storeId && visibility) {
        await visibilityMutation.mutateAsync({
          path: { id, storeId },
          body: { questions: visibility },
        });
      }

      toast.success(response.message || 'アンケートを更新しました');
      queryClient.invalidateQueries({ queryKey: getCrmSurveysQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmSurveysByIdQueryKey({ path: { id } }),
      });
      if (storeId) {
        queryClient.invalidateQueries({
          queryKey: getCrmSurveysByIdStoresByStoreIdVisibilityQueryKey({
            path: { id, storeId },
          }),
        });
      }
      router.push(navigate('/surveys/[id]', id));
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <Form {...form}>
      <div className="mb-4 flex items-center justify-end">
        <SearchableSelect<SurveyStoreOption>
          value={storeId}
          valueLabel={selectedStore ? `${selectedStore.store_id} ${selectedStore.name}` : undefined}
          options={storeOptions}
          placeholder="店舗を選択"
          searchPlaceholder="店舗名・店舗IDで検索..."
          emptyMessage="該当する店舗がありません"
          onSelect={(store) => onStoreChange(store?.id ?? '')}
          getOptionKey={(store) => store.id}
          getOptionLabel={(store) => `${store.store_id} ${store.name}`}
          getOptionKeywords={(store) => [store.name, store.store_id, store.id].join(' ')}
        />
      </div>
      <SurveyForm
        existingSurveys={existingSurveys}
        isEdit
        isSubmitting={updateMutation.isPending || visibilityMutation.isPending}
        surveyId={id}
        storeId={storeId}
        onCancel={() => router.push(navigate('/surveys/[id]', id))}
        onSubmit={handleSubmit}
      />
    </Form>
  );
}

export default function SurveyEditPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id;

  const { data: surveyListData } = useQuery({
    ...getCrmSurveysOptions({ query: { page: 1, limit: 200 } as never }),
  });

  const { data: storesData } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100 } }),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmSurveysByIdOptions({ path: { id: id ?? '' } }),
    enabled: Boolean(id),
  });

  const survey = data?.survey;
  const storeOptions = useMemo(
    () =>
      storesData?.stores?.map((store) => ({
        id: store.id,
        name: store.name,
        store_id: store.store_id,
      })) ?? [],
    [storesData],
  );
  const selectedStoreId = searchParams.get('storeId') ?? storeOptions[0]?.id ?? null;
  const selectedStore =
    storeOptions.find((store) => store.id === selectedStoreId) ?? storeOptions[0] ?? null;

  useEffect(() => {
    if (!storeOptions.length || searchParams.get('storeId')) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.set('storeId', storeOptions[0]!.id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, storeOptions]);

  const handleStoreChange = (storeId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (storeId) {
      next.set('storeId', storeId);
    } else {
      next.delete('storeId');
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const defaultValues = useMemo<SurveyFormValues | null>(() => {
    if (!survey) return null;
    return mapSurveyDetailToFormValues(survey);
  }, [survey]);

  return (
    <DataStateBoundary isLoading={isLoading} isError={isError} isEmpty={!survey} onRetry={refetch}>
      <PageHeader
        breadcrumb={
          <BackLink label="アンケート詳細に戻る" href={navigate('/surveys/[id]', id ?? '')} />
        }
        title="アンケート編集"
      />
      <div className="mx-auto max-w-[960px] p-4">
        {defaultValues && id && (
          <SurveyEditForm
            id={id}
            defaultValues={defaultValues}
            existingSurveys={surveyListData?.surveys ?? []}
            storeId={selectedStoreId}
            storeOptions={storeOptions}
            selectedStore={selectedStore}
            onStoreChange={handleStoreChange}
          />
        )}
      </div>
    </DataStateBoundary>
  );
}
