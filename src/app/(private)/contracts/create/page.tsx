'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmMainContractsQueryKey,
  postCrmMainContractsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { PostCrmMainContractsResponse } from '@/lib/api/types.gen';
import { MainContractStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ContractForm } from '../_components/contract-form';
import {
  type ContractFormSubmitValues,
  type ContractFormValues,
  DAYS_OF_WEEK,
  contractFormSchema,
} from '../_schemas/contract-form.schema';

const emptyDefaults: ContractFormValues = {
  name: '',
  code: '',
  contract_type: undefined as unknown as ContractFormValues['contract_type'],
  brand: undefined as unknown as ContractFormValues['brand'],
  status: MainContractStatus.ACTIVE,
  companion_benefit_enabled: false,
  mutual_use: false,
  same_day_cancellation: false,
  family_contract_allowed: false,
  price_including_tax: undefined as unknown as number,
  tax_rate: undefined as unknown as number,
  accounting_code: '',
  start_date: '',
  usage_hours_by_day: DAYS_OF_WEEK.map((day) => ({
    day,
    from: '00:00',
    to: '23:59',
    all_day: true,
  })),
};

export default function ContractCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<ContractFormValues, unknown, ContractFormSubmitValues>({
    resolver: zodResolver(contractFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyDefaults,
  });

  const createMutation = useMutation({
    ...postCrmMainContractsMutation(),
    onSuccess: (res: PostCrmMainContractsResponse) => {
      toast.success('主契約を作成しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMainContractsQueryKey(),
        refetchType: 'all',
      });
      router.push(navigate('/contracts/[id]', res.main_contract.id));
    },
    onError: () => {
      toast.error('主契約の作成に失敗しました');
    },
  });

  const onSubmit = (values: ContractFormSubmitValues) => {
    createMutation.mutate({ body: values });
  };

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="主契約管理に戻る" href={navigate('/contracts')} />}
        title="主契約 新規登録"
      />
      <div className="mx-auto max-w-240 p-4">
        <Form {...form}>
          <ContractForm
            isEdit={false}
            isSubmitting={createMutation.isPending}
            onCancel={() => router.push(navigate('/contracts'))}
            onSubmit={onSubmit}
          />
        </Form>
      </div>
    </>
  );
}
