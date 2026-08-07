'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmCampaignsQueryKey,
  postCrmCampaignsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CampaignForm } from '../_components/campaign-form';
import { campaignFormValuesToRequestBody } from '../_schemas/campaign-form.mapper';
import {
  type CampaignFormSubmitValues,
  type CampaignFormValues,
  campaignFormSchema,
  emptyCampaignFormValues,
} from '../_schemas/campaign-form.schema';
import { getCampaignCodeServerErrorMessage } from '../_utils/campaign-error';

export default function CampaignCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<CampaignFormValues, unknown, CampaignFormSubmitValues>({
    resolver: zodResolver(campaignFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyCampaignFormValues,
  });

  const createMutation = useMutation({
    ...postCrmCampaignsMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'キャンペーンを作成しました');
      queryClient.invalidateQueries({
        queryKey: getCrmCampaignsQueryKey(),
        refetchType: 'all',
      });
      router.push(navigate('/campaigns/[id]', res.campaign.id));
    },
    onError: (error) => {
      const message =
        typeof error === 'object' && error !== null && 'error' in error
          ? String((error as { error?: string }).error)
          : 'キャンペーンの作成に失敗しました';

      const codeErrorMessage = getCampaignCodeServerErrorMessage(error);
      if (codeErrorMessage) {
        form.setError('code', { type: 'server', message: codeErrorMessage });
      }

      toast.error(message);
    },
  });

  const onSubmit = (values: CampaignFormSubmitValues) => {
    createMutation.mutate({
      body: campaignFormValuesToRequestBody(values),
    });
  };

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="キャンペーン管理に戻る" href={navigate('/campaigns')} />}
        title="キャンペーン 新規登録"
      />
      <div className="px-6 py-4">
        <Form {...form}>
          <form
            className="mx-auto max-w-[960px]"
            onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}
          >
            <CampaignForm
              isSubmitting={createMutation.isPending}
              onCancel={() => router.push(navigate('/campaigns'))}
            />
          </form>
        </Form>
      </div>
    </>
  );
}
