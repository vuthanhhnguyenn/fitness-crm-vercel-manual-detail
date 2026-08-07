'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmMainContractsOptions,
  getCrmOptionDiscountsQueryKey,
  getCrmOptionsOptions,
  postCrmOptionDiscountsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { OptionDiscountForm } from '../_components/option-discount-form';
import {
  type OptionDiscountFormSubmitValues,
  type OptionDiscountFormValues,
  emptyDefaults,
  optionDiscountFormSchema,
} from '../_schemas/option-discount-form.schema';

export default function OptionDiscountCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const { data: mainContractsData } = useQuery({
    ...getCrmMainContractsOptions({ query: { page: 1, limit: 200, status: 'active' } }),
  });
  const { data: optionsData } = useQuery({
    ...getCrmOptionsOptions({ query: { page: 1, limit: 200, status: 'active' } }),
  });

  const mainContracts = mainContractsData?.main_contracts ?? [];
  const optionMasters = optionsData?.options ?? [];

  const form = useForm<OptionDiscountFormValues, unknown, OptionDiscountFormSubmitValues>({
    resolver: zodResolver(optionDiscountFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyDefaults,
  });

  const createMutation = useMutation({
    ...postCrmOptionDiscountsMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'セット割を作成しました');
      queryClient.invalidateQueries({
        queryKey: getCrmOptionDiscountsQueryKey(),
        refetchType: 'all',
      });
      router.push(navigate('/option-discount/[id]', res.option_discount.id));
    },
    onError: () => {
      toast.error('セット割の作成に失敗しました');
    },
  });

  const onSubmit = (values: OptionDiscountFormSubmitValues) => {
    const contractNames = values.target_contract_ids.map(
      (id) => mainContracts.find((c) => c.id === id)?.name ?? id,
    );
    const optionNames = values.target_option_ids.map(
      (id) => optionMasters.find((o) => o.id === id)?.name ?? id,
    );

    createMutation.mutate({
      body: {
        name: values.name,
        code: values.code,
        description: values.description.trim() || null,
        target_contracts: contractNames,
        target_options: optionNames,
        discount_type: values.discount_type,
        discount_value: Number(values.discount_value),
        conditions: values.conditions,
        status: values.status,
      },
    });
  };

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="セット割設定に戻る" href={navigate('/option-discount')} />}
        title="セット割 新規登録"
      />
      <div className="mx-auto max-w-240 p-4">
        <Form {...form}>
          <form>
            <OptionDiscountForm
              mainContracts={mainContracts}
              optionMasters={optionMasters}
              isSubmitting={createMutation.isPending}
              onCancel={() => router.push(navigate('/option-discount'))}
              onSubmit={onSubmit}
              onError={scrollToFirstError}
            />
          </form>
        </Form>
      </div>
    </>
  );
}
