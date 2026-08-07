'use client';

import { useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmLockersByIdOptions,
  getCrmLockersContractsQueryKey,
  getCrmMembersByIdContractsSummaryOptions,
  postCrmLockersContractsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { LockerContractStatus, LockerLockType } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LockerContractForm } from '../_components/locker-contract-form';
import {
  type LockerContractFormSubmitValues,
  type LockerContractFormValues,
  lockerContractFormSchema,
} from '../_schemas/locker-contract-form.schema';
import {
  emptyLockerContractFormDefaults,
  lockerContractFormValuesToCreateBody,
  validateDialPassword,
} from '../_utils/locker-contract-form.util';

export default function LockerContractCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<LockerContractFormValues, unknown, LockerContractFormSubmitValues>({
    resolver: zodResolver(lockerContractFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: emptyLockerContractFormDefaults,
  });

  const memberId = useWatch({ control: form.control, name: 'member_id' });
  const lockerId = useWatch({ control: form.control, name: 'locker_id' });
  const slotNumber = useWatch({ control: form.control, name: 'slot_number' });
  const password = useWatch({ control: form.control, name: 'password' });

  const { data: unpaidSummary } = useQuery({
    ...getCrmMembersByIdContractsSummaryOptions({ path: { id: memberId } }),
    enabled: Boolean(memberId),
  });

  const { data: lockerDetailData } = useQuery({
    ...getCrmLockersByIdOptions({ path: { id: lockerId } }),
    enabled: Boolean(lockerId),
  });

  const selectedSlot = lockerDetailData?.locker.slot_items.find(
    (slot) => slot.slot_number === slotNumber,
  );
  const hasUnpaidBalance = (unpaidSummary?.unpaid_amount ?? 0) > 0;
  const isSlotOccupied =
    selectedSlot?.status === LockerContractStatus.IN_USE && Boolean(slotNumber);

  const createMutation = useMutation({
    ...postCrmLockersContractsMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'ロッカー契約を登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmLockersContractsQueryKey() });
      router.push(navigate('/lockers/contracts/[id]', res.contract.id));
    },
    onError: (error) => {
      const message =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error?: string }).error)
          : 'ロッカー契約の登録に失敗しました';
      toast.error(message);
    },
  });

  const onSubmit = (values: LockerContractFormSubmitValues) => {
    const passwordError = validateDialPassword(selectedSlot?.lock_type, values.password);
    if (passwordError) {
      form.setError('password', { message: passwordError });
      return;
    }

    createMutation.mutate({
      body: lockerContractFormValuesToCreateBody(values),
    });
  };

  const isDialLock = selectedSlot?.lock_type !== LockerLockType.CYLINDER;

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/lockers/contracts'), label: 'ロッカー契約管理' },
            { label: 'ロッカー契約 新規登録' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <div className="mb-4">
          <h1 className="text-xl font-bold">ロッカー契約 新規登録</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <LockerContractForm mode="create" locker={lockerDetailData?.locker} />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(navigate('/lockers/contracts'))}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={
              createMutation.isPending ||
              hasUnpaidBalance ||
              isSlotOccupied ||
              (isDialLock && !password)
            }
            onClick={form.handleSubmit(onSubmit, scrollToFirstError)}
          >
            {createMutation.isPending ? '登録中...' : '契約を登録する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
