'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmSurveysByIdOptions,
  getCrmSurveysByIdQueryKey,
  getCrmSurveysOptions,
  getCrmSurveysQueryKey,
  putCrmSurveysByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { Options } from '@/lib/api/sdk.gen';
import type {
  PutCrmSurveysByIdData,
  PutCrmSurveysByIdError,
  PutCrmSurveysByIdResponse,
} from '@/lib/api/types.gen';
import type { GetCrmSurveysResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { SurveyForm } from '../../_components/survey-form';
import {
  type SurveyFormSubmitValues,
  type SurveyFormValues,
  mapSurveyDetailToFormValues,
  mapSurveyFormValuesToPayload,
  surveyFormSchema,
} from '../../_schemas/survey-form.schema';

function SurveyEditForm({
  id,
  defaultValues,
  existingSurveys,
}: Readonly<{
  id: string;
  defaultValues: SurveyFormValues;
  existingSurveys: GetCrmSurveysResponse['surveys'];
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
    onSuccess: (response) => {
      toast.success(response.message || 'アンケートを更新しました');
      queryClient.invalidateQueries({ queryKey: getCrmSurveysQueryKey(), refetchType: 'all' });
      queryClient.invalidateQueries({
        queryKey: getCrmSurveysByIdQueryKey({ path: { id } }),
      });
      router.push(navigate('/surveys/[id]', id));
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'アンケートの更新に失敗しました';
      toast.error(message);
    },
  });

  return (
    <Form {...form}>
      <SurveyForm
        existingSurveys={existingSurveys}
        isEdit
        isSubmitting={updateMutation.isPending}
        surveyId={id}
        onCancel={() => router.push(navigate('/surveys/[id]', id))}
        onSubmit={(values) =>
          updateMutation.mutate({
            path: { id },
            body: mapSurveyFormValuesToPayload(values) as never,
          })
        }
      />
    </Form>
  );
}

export default function SurveyEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: surveyListData } = useQuery({
    ...getCrmSurveysOptions({ query: { page: 1, limit: 200 } as never }),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmSurveysByIdOptions({ path: { id: id ?? '' } }),
    enabled: Boolean(id),
  });

  const survey = data?.survey;

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
          />
        )}
      </div>
    </DataStateBoundary>
  );
}
