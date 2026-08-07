'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmCampaignsByIdOptions,
  getCrmCampaignsByIdQueryKey,
  getCrmCampaignsQueryKey,
  patchCrmCampaignsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CampaignForm } from '../../_components/campaign-form';
import {
  campaignDetailToFormValues,
  campaignFormValuesToRequestBody,
} from '../../_schemas/campaign-form.mapper';
import {
  type CampaignFormSubmitValues,
  type CampaignFormValues,
  campaignFormSchema,
} from '../../_schemas/campaign-form.schema';
import { getCampaignCodeServerErrorMessage } from '../../_utils/campaign-error';

interface CampaignEditFormProps {
  id: string;
  defaultValues: CampaignFormValues;
}

function CampaignEditForm({ id, defaultValues }: Readonly<CampaignEditFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<CampaignFormValues, unknown, CampaignFormSubmitValues>({
    resolver: zodResolver(campaignFormSchema) as never,
    mode: 'onChange',
    defaultValues,
  });

  const updateMutation = useMutation({
    ...patchCrmCampaignsByIdMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'キャンペーンを更新しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmCampaignsQueryKey(),
        refetchType: 'all',
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdQueryKey({ path: { id } }),
      });
      router.push(navigate('/campaigns/[id]', id));
    },
    onError: (error) => {
      const message =
        typeof error === 'object' && error !== null && 'error' in error
          ? String((error as { error?: string }).error)
          : 'キャンペーンの更新に失敗しました';

      const codeErrorMessage = getCampaignCodeServerErrorMessage(error);
      if (codeErrorMessage) {
        form.setError('code', { type: 'server', message: codeErrorMessage });
      }

      toast.error(message);
    },
  });

  const onSubmit = (values: CampaignFormSubmitValues) => {
    updateMutation.mutate({
      path: { id },
      body: campaignFormValuesToRequestBody(values),
    });
  };

  return (
    <div className="px-6 py-4">
      <Form {...form}>
        <form
          className="mx-auto max-w-[960px]"
          onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}
        >
          <CampaignForm
            isEdit
            isSubmitting={updateMutation.isPending}
            campaignId={id}
            onCancel={() => router.push(navigate('/campaigns/[id]', id))}
          />
        </form>
      </Form>
    </div>
  );
}

export default function CampaignEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmCampaignsByIdOptions({ path: { id: id ?? '' } }),
    enabled: Boolean(id),
  });

  const campaign = data?.campaign;

  const defaultValues = useMemo<CampaignFormValues | null>(() => {
    if (!campaign) return null;
    return campaignDetailToFormValues(campaign);
  }, [campaign]);

  return (
    <>
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!campaign}
        onRetry={refetch}
      >
        <PageHeader
          breadcrumb={
            <BackLink label="キャンペーン詳細に戻る" href={navigate('/campaigns/[id]', id)} />
          }
          title="キャンペーン 編集"
        />
        {defaultValues && id && <CampaignEditForm id={id} defaultValues={defaultValues} />}
      </DataStateBoundary>
    </>
  );
}
