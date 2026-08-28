'use client';

import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter, useSearchParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmCampaignsByIdOptions,
  getCrmCampaignsQueryKey,
  postCrmCampaignsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CampaignDiscardDialog } from '../_components/campaign-discard-dialog';
import { CampaignForm } from '../_components/campaign-form';
import { useCampaignUnsavedChanges } from '../_hooks/use-campaign-unsaved-changes';
import { toCampaignRequestBody, toDuplicatedFormValues } from '../_schemas/campaign-form.mapper';
import {
  CAMPAIGN_FORM_DEFAULT_VALUES,
  type CampaignFormValues,
  campaignFormSchema,
} from '../_schemas/campaign-form.schema';
import {
  getCampaignCodeServerErrorMessage,
  getCampaignErrorMessage,
} from '../_utils/campaign-error';

function CampaignCreatePageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema) as never,
    mode: 'onChange',
    defaultValues: CAMPAIGN_FORM_DEFAULT_VALUES,
  });

  // G-03 FR-S003 複製: コピー元を読み込み、名称に「（コピー）」を付けて受付停止で初期化する
  const { data: sourceData } = useQuery({
    ...getCrmCampaignsByIdOptions({ path: { id: copyFromId ?? '' } }),
    enabled: Boolean(copyFromId),
  });

  useEffect(() => {
    if (sourceData?.campaign) {
      form.reset(toDuplicatedFormValues(sourceData.campaign));
    }
  }, [sourceData, form]);

  const createMutation = useMutation({
    ...postCrmCampaignsMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'キャンペーンを登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmCampaignsQueryKey() });
      router.push(navigate('/campaigns/[id]', res.campaign.id));
    },
    onError: (error) => {
      const codeErrorMessage = getCampaignCodeServerErrorMessage(error);
      if (codeErrorMessage) {
        form.setError('campaignCode', { type: 'server', message: codeErrorMessage });
      }
      toast.error(getCampaignErrorMessage(error, 'キャンペーンの登録に失敗しました'));
    },
  });

  const onSubmit = (values: CampaignFormValues) => {
    createMutation.mutate({ body: toCampaignRequestBody(values) });
  };

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useCampaignUnsavedChanges(form.formState.isDirty);
  const leaveToList = () => confirmDiscard(() => router.push(navigate('/campaigns')));

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="キャンペーン管理に戻る" onClick={leaveToList} />}
        title="キャンペーン 新規登録"
      />
      <div className="px-6 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <CampaignForm isSubmitting={createMutation.isPending} onCancel={leaveToList} />
          </form>
        </Form>
      </div>

      <CampaignDiscardDialog
        open={discardDialogOpen}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </>
  );
}

export default function CampaignCreatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CampaignCreatePageContent />
    </Suspense>
  );
}
