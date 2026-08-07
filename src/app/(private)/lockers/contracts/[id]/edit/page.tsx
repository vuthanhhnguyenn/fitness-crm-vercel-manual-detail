'use client';

import { useEffect, useMemo } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmLockersByIdOptions,
  getCrmLockersContractsByIdOptions,
  getCrmLockersContractsByIdQueryKey,
  getCrmLockersContractsQueryKey,
  patchCrmLockersContractsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { LockerContractStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LockerContractForm } from '../../_components/locker-contract-form';
import {
  type LockerContractFormSubmitValues,
  type LockerContractFormValues,
  lockerContractFormSchema,
} from '../../_schemas/locker-contract-form.schema';
import {
  emptyLockerContractFormDefaults,
  lockerContractDetailToFormValues,
  lockerContractFormValuesToUpdateBody,
  validateDialPassword,
} from '../../_utils/locker-contract-form.util';

export default function LockerContractEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const contractId = params?.id;
  const scrollToFirstError = useScrollToFirstError();

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmLockersContractsByIdOptions({ path: { id: contractId } }),
    enabled: Boolean(contractId),
  });

  const contract = data?.contract;

  const defaultValues = useMemo<LockerContractFormValues>(() => {
    if (!contract) return emptyLockerContractFormDefaults;
    return lockerContractDetailToFormValues(contract);
  }, [contract]);

  const form = useForm<LockerContractFormValues, unknown, LockerContractFormSubmitValues>({
    resolver: zodResolver(lockerContractFormSchema) as never,
    mode: 'onSubmit',
    defaultValues,
  });

  useEffect(() => {
    if (!contract) return;
    form.reset(defaultValues);
  }, [contract, defaultValues, form]);

  const { isDirty } = useFormState({ control: form.control });
  const lockerId = useWatch({ control: form.control, name: 'locker_id' });
  const slotNumber = useWatch({ control: form.control, name: 'slot_number' });

  const { data: lockerDetailData } = useQuery({
    ...getCrmLockersByIdOptions({ path: { id: lockerId } }),
    enabled: Boolean(lockerId),
  });

  const selectedSlot = lockerDetailData?.locker.slot_items.find(
    (slot) => slot.slot_number === slotNumber,
  );
  const isSlotOccupied =
    selectedSlot?.status === LockerContractStatus.IN_USE &&
    slotNumber !== contract?.locker_number &&
    Boolean(slotNumber);

  const patchMutation = useMutation({
    ...patchCrmLockersContractsByIdMutation(),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getCrmLockersContractsByIdQueryKey({ path: { id: contractId } }),
        }),
        queryClient.invalidateQueries({ queryKey: getCrmLockersContractsQueryKey() }),
      ]);
      toast.success(res.message || 'ロッカー契約を更新しました');
      router.push(navigate('/lockers/contracts/[id]', res.contract.id));
    },
    onError: (error) => {
      const message =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error?: string }).error)
          : 'ロッカー契約の更新に失敗しました';
      toast.error(message);
    },
  });

  const onSubmit = (values: LockerContractFormSubmitValues) => {
    const passwordError = validateDialPassword(selectedSlot?.lock_type, values.password);
    if (passwordError) {
      form.setError('password', { message: passwordError });
      return;
    }

    patchMutation.mutate({
      path: { id: contractId },
      body: lockerContractFormValuesToUpdateBody(values),
    });
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (!isDirty) return;
    onSubmit(values);
  }, scrollToFirstError);

  if (isLoading || isError || !contract) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!contract}
        onRetry={() => refetch()}
        errorTitle="ロッカー契約の取得に失敗しました"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/lockers/contracts'), label: 'ロッカー契約管理' },
            {
              url: navigate('/lockers/contracts/[id]', contract.id),
              label: contract.contract_id,
            },
            { label: '編集' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <div className="mb-4">
          <h1 className="text-xl font-bold">ロッカー契約 編集</h1>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <LockerContractForm mode="edit" contract={contract} locker={lockerDetailData?.locker} />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(navigate('/lockers/contracts/[id]', contract.id))}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!isDirty || patchMutation.isPending || isSlotOccupied}
            onClick={handleSubmit}
          >
            {patchMutation.isPending ? '保存中...' : '変更を保存する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
