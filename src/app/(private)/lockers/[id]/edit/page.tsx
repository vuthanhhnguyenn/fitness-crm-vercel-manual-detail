'use client';

import { useForm, useFormState, useWatch } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { DiscardChangesDialog } from '@/components/common/discard-changes-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmLockersByIdOptions,
  getCrmLockersByIdQueryKey,
  getCrmLockersQueryKey,
  patchCrmLockersByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LockerForm } from '../../_components/locker-form';
import { useLockerFormInvalidHandler } from '../../_hooks/use-locker-form-invalid-handler.hook';
import { useLockerLocationDuplicate } from '../../_hooks/use-locker-location-duplicate.hook';
import {
  type LockerFormSubmitValues,
  type LockerFormValues,
  lockerFormSchema,
} from '../../_schemas/locker-form.schema';
import {
  lockerDetailToFormValues,
  lockerFormValuesToUpdateBody,
} from '../../_utils/locker-form.util';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

function LockerEditForm({ locker, id }: { locker: LockerDetail; id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handleInvalid = useLockerFormInvalidHandler();

  const form = useForm<LockerFormValues, unknown, LockerFormSubmitValues>({
    resolver: zodResolver(lockerFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: lockerDetailToFormValues(locker),
  });

  const { isDirty } = useFormState({ control: form.control });
  const storeId = useWatch({ control: form.control, name: 'store_id' });
  const locationSymbol = useWatch({ control: form.control, name: 'location_symbol' });

  // FR-001 異常系: a symbol already taken in the same store must not reach the API.
  // The locker's own symbol is excluded so editing without changing it stays valid.
  const isLocationDuplicate = useLockerLocationDuplicate({
    storeId,
    locationSymbol,
    excludeLockerId: id,
  });

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(isDirty);

  const patchMutation = useMutation({
    ...patchCrmLockersByIdMutation(),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCrmLockersByIdQueryKey({ path: { id } }) }),
        queryClient.invalidateQueries({
          queryKey: getCrmLockersQueryKey(),
        }),
      ]);
      toast.success(res.message || 'ロッカー情報を更新しました');
      router.push(navigate('/lockers/[id]', res.locker.id));
    },
    onError: (error) => {
      // Surface the API's own reason (e.g. the 409 location-symbol conflict).
      const message =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error?: string }).error)
          : 'ロッカー情報の更新に失敗しました';
      toast.error(message);
    },
  });

  const onSubmit = (values: LockerFormSubmitValues) => {
    patchMutation.mutate({
      path: { id },
      body: lockerFormValuesToUpdateBody(values),
    });
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (!isDirty || isLocationDuplicate) return;
    onSubmit(values);
  }, handleInvalid);

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/lockers'), label: 'ロッカー管理' },
            { url: navigate('/lockers/[id]', id), label: 'ロッカー詳細' },
            { label: 'ロッカー設備 編集' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <LockerForm mode="edit" lockerId={id} />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => confirmDiscard(() => router.push(navigate('/lockers/[id]', id)))}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!isDirty || patchMutation.isPending || isLocationDuplicate}
            onClick={handleSubmit}
          >
            {patchMutation.isPending ? '保存中...' : '変更を保存する'}
          </Button>
        </div>
      </div>

      <DiscardChangesDialog
        open={discardDialogOpen}
        onOpenChange={handleDiscardCancel}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </div>
  );
}

export default function LockerEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmLockersByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const locker = data?.locker;

  if (isLoading || isError || !locker || !id) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!locker}
        onRetry={() => refetch()}
        errorTitle="ロッカー情報の取得に失敗しました"
      />
    );
  }

  return <LockerEditForm key={id} locker={locker} id={id} />;
}
