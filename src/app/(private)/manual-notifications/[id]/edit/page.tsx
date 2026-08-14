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
  getCrmNotificationsByIdOptions,
  getCrmNotificationsByIdQueryKey,
  getCrmNotificationsFormConfigOptions,
  getCrmNotificationsQueryKey,
  patchCrmNotificationsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmNotificationsFormConfigResponse,
  PatchCrmNotificationsByIdError,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ManualNotificationForm } from '../../_components/manual-notification-form';
import {
  MANUAL_NOTIFICATION_SAVE_SUCCESS_MESSAGES,
  getManualNotificationActionPolicy,
} from '../../_constants/manual-notification.constants';
import {
  type ManualNotificationFormValues,
  manualNotificationDetailToFormValues,
  manualNotificationFormSchema,
  manualNotificationFormValuesToRequestBody,
} from '../../_schemas/manual-notification-form.schema';

interface ManualNotificationEditFormProps {
  readonly id: string;
  readonly defaultValues: ManualNotificationFormValues;
  readonly formConfig: GetCrmNotificationsFormConfigResponse;
}

function ManualNotificationEditForm({
  id,
  defaultValues,
  formConfig,
}: ManualNotificationEditFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ManualNotificationFormValues>({
    resolver: zodResolver(manualNotificationFormSchema) as never,
    mode: 'onChange',
    defaultValues,
  });
  const mutation = useMutation({
    ...patchCrmNotificationsByIdMutation(),
    onSuccess: (response) => {
      toast.success(MANUAL_NOTIFICATION_SAVE_SUCCESS_MESSAGES[response.item.status]);
      void queryClient.invalidateQueries({
        queryKey: getCrmNotificationsQueryKey(),
        refetchType: 'all',
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmNotificationsByIdQueryKey({ path: { id } }),
      });
      router.push(navigate('/manual-notifications/[id]', response.item.id));
    },
    onError: (error: PatchCrmNotificationsByIdError) => toast.error(error.userMessage),
  });

  const handleSubmit = (values: ManualNotificationFormValues, intent: 'save' | 'submit') => {
    mutation.mutate({
      path: { id },
      body: manualNotificationFormValuesToRequestBody(values, intent),
    });
  };

  return (
    <div className="px-6 py-4">
      <Form {...form}>
        <div className="mx-auto max-w-[960px]">
          <ManualNotificationForm
            formConfig={formConfig}
            isEdit
            notificationId={id}
            isSubmitting={mutation.isPending}
            onCancel={() => router.push(navigate('/manual-notifications/[id]', id))}
            onSubmit={handleSubmit}
          />
        </div>
      </Form>
    </div>
  );
}

export default function ManualNotificationEditPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ ...getCrmNotificationsByIdOptions({ path: { id } }) });
  const formConfigQuery = useQuery({ ...getCrmNotificationsFormConfigOptions() });
  const item = query.data?.item;
  const isEditable = item ? getManualNotificationActionPolicy(item).canEdit : false;
  const defaultValues = useMemo(
    () => (item && isEditable ? manualNotificationDetailToFormValues(item) : null),
    [isEditable, item],
  );

  return (
    <DataStateBoundary
      isLoading={query.isLoading || formConfigQuery.isLoading}
      isError={query.isError || formConfigQuery.isError}
      isEmpty={!defaultValues || !formConfigQuery.data}
      emptyTitle={item ? 'この通知は編集できません' : '通知が見つかりません'}
      onRetry={() => {
        void query.refetch();
        void formConfigQuery.refetch();
      }}
    >
      <PageHeader
        breadcrumb={
          <BackLink label="通知詳細に戻る" href={navigate('/manual-notifications/[id]', id)} />
        }
        title="手動配信通知 編集"
      />
      {defaultValues && formConfigQuery.data ? (
        <ManualNotificationEditForm
          id={id}
          defaultValues={defaultValues}
          formConfig={formConfigQuery.data}
        />
      ) : null}
    </DataStateBoundary>
  );
}
