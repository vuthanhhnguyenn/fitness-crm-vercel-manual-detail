'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmSurveysOptions,
  getCrmSurveysQueryKey,
  postCrmSurveysMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { Options } from '@/lib/api/sdk.gen';
import type {
  PostCrmSurveysData,
  PostCrmSurveysError,
  PostCrmSurveysResponse,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { SurveyForm } from '../_components/survey-form';
import {
  type SurveyFormSubmitValues,
  type SurveyFormValues,
  createEmptySurveyFormValues,
  mapSurveyFormValuesToPayload,
  surveyFormSchema,
} from '../_schemas/survey-form.schema';

export default function SurveyCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    ...getCrmSurveysOptions({ query: { page: 1, limit: 200 } as never }),
  });

  const form = useForm<SurveyFormValues, unknown, SurveyFormSubmitValues>({
    resolver: zodResolver(surveyFormSchema) as never,
    mode: 'onChange',
    defaultValues: createEmptySurveyFormValues(),
  });

  const createMutation = useMutation<
    PostCrmSurveysResponse,
    PostCrmSurveysError,
    Options<PostCrmSurveysData>
  >({
    ...postCrmSurveysMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'アンケートを登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmSurveysQueryKey(), refetchType: 'all' });
      router.push(navigate('/surveys/[id]', response.survey.id));
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'アンケートの作成に失敗しました';
      toast.error(message);
    },
  });

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="アンケート管理に戻る" href={navigate('/surveys')} />}
        title="アンケート新規登録"
      />
      <div className="mx-auto max-w-[960px] p-4">
        <Form {...form}>
          <SurveyForm
            existingSurveys={data?.surveys ?? []}
            isSubmitting={createMutation.isPending}
            onCancel={() => router.push(navigate('/surveys'))}
            onSubmit={(values) =>
              createMutation.mutate({ body: mapSurveyFormValuesToPayload(values) as never })
            }
          />
        </Form>
      </div>
    </>
  );
}
