'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

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
import type { GetCrmNotificationsFormConfigResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ManualNotificationBackLink } from '../../_components/manual-notification-back-link';
import { ManualNotificationDiscardDialog } from '../../_components/manual-notification-discard-dialog';
import { ManualNotificationForm } from '../../_components/manual-notification-form';
import {
  MANUAL_NOTIFICATION_SAVE_SUCCESS_MESSAGES,
  getManualNotificationActionPolicy,
} from '../../_constants/manual-notification.constants';
import { withManualNotificationError } from '../../_lib/manual-notification-mutation.util';
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
  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(form.formState.isDirty);
  const navigateBack = () => router.push(navigate('/manual-notifications/[id]', id));
  const mutationOptions = patchCrmNotificationsByIdMutation();
  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: withManualNotificationError(mutationOptions.mutationFn!),
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
  });

  const handleSubmit = (values: ManualNotificationFormValues, intent: 'save' | 'submit') => {
    mutation.mutate({
      path: { id },
      body: manualNotificationFormValuesToRequestBody(values, intent),
    });
  };

  return (
    <>
      <PageHeader
        breadcrumb={
          <ManualNotificationBackLink
            label="通知詳細に戻る"
            href={navigate('/manual-notifications/[id]', id)}
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
              event.preventDefault();
              confirmDiscard(navigateBack);
            }}
          />
        }
        title="手動配信通知 編集"
      />
      <div className="px-6 py-4">
        <Form {...form}>
          <div className="mx-auto max-w-[960px]">
            <ManualNotificationForm
              formConfig={formConfig}
              isEdit
              notificationId={id}
              isSubmitting={mutation.isPending}
              onCancel={() => confirmDiscard(navigateBack)}
              onSubmit={handleSubmit}
            />
          </div>
        </Form>
      </div>
      <ManualNotificationDiscardDialog
        open={discardDialogOpen}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </>
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
