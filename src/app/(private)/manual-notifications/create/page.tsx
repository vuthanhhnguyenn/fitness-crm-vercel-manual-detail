'use client';

import { type UseFormReturn, useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmNotificationsFormConfigOptions,
  getCrmNotificationsQueryKey,
  postCrmNotificationsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmNotificationsFormConfigResponse,
  PostCrmNotificationsError,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ManualNotificationForm } from '../_components/manual-notification-form';
import { MANUAL_NOTIFICATION_SAVE_SUCCESS_MESSAGES } from '../_constants/manual-notification.constants';
import {
  type ManualNotificationFormValues,
  emptyManualNotificationFormValues,
  manualNotificationFormSchema,
  manualNotificationFormValuesToRequestBody,
} from '../_schemas/manual-notification-form.schema';

export default function ManualNotificationCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formConfigQuery = useQuery({ ...getCrmNotificationsFormConfigOptions() });
  const form = useForm<ManualNotificationFormValues>({
    resolver: zodResolver(manualNotificationFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyManualNotificationFormValues,
  });
  const mutation = useMutation({
    ...postCrmNotificationsMutation(),
    onSuccess: (response) => {
      toast.success(MANUAL_NOTIFICATION_SAVE_SUCCESS_MESSAGES[response.item.status]);
      void queryClient.invalidateQueries({
        queryKey: getCrmNotificationsQueryKey(),
        refetchType: 'all',
      });
      router.push(navigate('/manual-notifications/[id]', response.item.id));
    },
    onError: (error: PostCrmNotificationsError) => toast.error(error.userMessage),
  });

  const handleSubmit = (values: ManualNotificationFormValues, intent: 'save' | 'submit') => {
    mutation.mutate({
      body: manualNotificationFormValuesToRequestBody(values, intent),
    });
  };

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="手動配信通知に戻る" href={navigate('/manual-notifications')} />
        }
        title="手動配信通知 新規作成"
      />
      <DataStateBoundary
        isLoading={formConfigQuery.isLoading}
        isError={formConfigQuery.isError}
        isEmpty={!formConfigQuery.data}
        onRetry={() => void formConfigQuery.refetch()}
      >
        {formConfigQuery.data ? (
          <CreateFormContent
            form={form}
            formConfig={formConfigQuery.data}
            isSubmitting={mutation.isPending}
            onCancel={() => router.push(navigate('/manual-notifications'))}
            onSubmit={handleSubmit}
          />
        ) : null}
      </DataStateBoundary>
    </>
  );
}

function CreateFormContent({
  form,
  formConfig,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  readonly form: UseFormReturn<ManualNotificationFormValues>;
  readonly formConfig: GetCrmNotificationsFormConfigResponse;
  readonly isSubmitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (values: ManualNotificationFormValues, intent: 'save' | 'submit') => void;
}) {
  return (
    <div className="px-6 py-4">
      <Form {...form}>
        <div className="mx-auto max-w-[960px]">
          <ManualNotificationForm
            formConfig={formConfig}
            isSubmitting={isSubmitting}
            onCancel={onCancel}
            onSubmit={onSubmit}
          />
        </div>
      </Form>
    </div>
  );
}
