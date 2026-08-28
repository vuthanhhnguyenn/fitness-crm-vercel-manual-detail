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
  getCrmCampaignsByIdChangeHistoryQueryKey,
  getCrmCampaignsByIdOptions,
  getCrmCampaignsByIdQueryKey,
  getCrmCampaignsQueryKey,
  patchCrmCampaignsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CampaignDiscardDialog } from '../../_components/campaign-discard-dialog';
import { CampaignForm } from '../../_components/campaign-form';
import { useCampaignUnsavedChanges } from '../../_hooks/use-campaign-unsaved-changes';
import { toCampaignFormValues, toCampaignRequestBody } from '../../_schemas/campaign-form.mapper';
import { type CampaignFormValues, campaignFormSchema } from '../../_schemas/campaign-form.schema';
import {
  getCampaignCodeServerErrorMessage,
  getCampaignErrorMessage,
  isCampaignInUseError,
} from '../../_utils/campaign-error';

interface CampaignEditFormProps {
  id: string;
  defaultValues: CampaignFormValues;
}

function CampaignEditForm({ id, defaultValues }: Readonly<CampaignEditFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<CampaignFormValues>({
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
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdQueryKey({ path: { id } }),
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdChangeHistoryQueryKey({ path: { id } }),
      });
      router.push(navigate('/campaigns/[id]', id));
    },
    onError: (error) => {
      const codeErrorMessage = getCampaignCodeServerErrorMessage(error);
      if (codeErrorMessage) {
        form.setError('campaignCode', { type: 'server', message: codeErrorMessage });
      }

      // E-CMP-002: 適用中の会員・申請があるため受付可否以外は保存できない。
      // フォームは編集可能なままなので、送信時にこの理由を明示する。
      if (isCampaignInUseError(error)) {
        form.setError('name', {
          type: 'server',
          message:
            '適用中の会員または申請があるため変更できません。受付を停止し、新しいキャンペーンを登録してください。',
        });
        scrollToFirstError();
      }

      toast.error(getCampaignErrorMessage(error, 'キャンペーンの更新に失敗しました'));
    },
  });

  const onSubmit = (values: CampaignFormValues) => {
    updateMutation.mutate({ path: { id }, body: toCampaignRequestBody(values) });
  };

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useCampaignUnsavedChanges(form.formState.isDirty);
  const leaveToDetail = () => confirmDiscard(() => router.push(navigate('/campaigns/[id]', id)));

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="キャンペーン詳細に戻る" onClick={leaveToDetail} />}
        title="キャンペーン 編集"
      />
      <div className="px-6 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <CampaignForm isEdit isSubmitting={updateMutation.isPending} onCancel={leaveToDetail} />
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
    return toCampaignFormValues(campaign);
  }, [campaign]);

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!campaign}
      onRetry={refetch}
    >
      {defaultValues && id && <CampaignEditForm id={id} defaultValues={defaultValues} />}
    </DataStateBoundary>
  );
}
