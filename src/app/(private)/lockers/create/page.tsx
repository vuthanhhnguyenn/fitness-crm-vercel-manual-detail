'use client';

import { useForm, useFormState, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DiscardChangesDialog } from '@/components/common/discard-changes-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { getCrmLockersQueryKey, postCrmLockersMutation } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LockerForm } from '../_components/locker-form';
import { useLockerFormInvalidHandler } from '../_hooks/use-locker-form-invalid-handler.hook';
import { useLockerLocationDuplicate } from '../_hooks/use-locker-location-duplicate.hook';
import {
  type LockerFormSubmitValues,
  type LockerFormValues,
  lockerFormSchema,
} from '../_schemas/locker-form.schema';
import { emptyLockerFormDefaults, lockerFormValuesToCreateBody } from '../_utils/locker-form.util';

export default function LockerCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handleInvalid = useLockerFormInvalidHandler();

  const form = useForm<LockerFormValues, unknown, LockerFormSubmitValues>({
    resolver: zodResolver(lockerFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: emptyLockerFormDefaults,
  });

  const { isDirty } = useFormState({ control: form.control });
  const storeId = useWatch({ control: form.control, name: 'store_id' });
  const locationSymbol = useWatch({ control: form.control, name: 'location_symbol' });

  // FR-001 異常系: a symbol already taken in the same store must not reach the API.
  const isLocationDuplicate = useLockerLocationDuplicate({ storeId, locationSymbol });

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(isDirty);

  const createMutation = useMutation({
    ...postCrmLockersMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'ロッカーを登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmLockersQueryKey() });
      router.push(navigate('/lockers/[id]', res.locker.id));
    },
    onError: (error) => {
      // Surface the API's own reason (e.g. the 409 location-symbol conflict) instead of a
      // generic failure message.
      const message =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error?: string }).error)
          : 'ロッカーの登録に失敗しました';
      toast.error(message);
    },
  });

  const onSubmit = (values: LockerFormSubmitValues) => {
    if (isLocationDuplicate) return;

    createMutation.mutate({
      body: lockerFormValuesToCreateBody(values),
    });
  };

  const handleSubmit = form.handleSubmit(onSubmit, handleInvalid);

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/lockers'), label: 'ロッカー管理' },
            { label: 'ロッカー設備 新規登録' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <LockerForm mode="create" />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => confirmDiscard(() => router.push(navigate('/lockers')))}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={createMutation.isPending || isLocationDuplicate}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? '登録中...' : '入力内容を確認する'}
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
