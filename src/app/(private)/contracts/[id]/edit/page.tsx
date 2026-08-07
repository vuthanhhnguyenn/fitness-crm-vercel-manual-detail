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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';

import {
  getCrmMainContractsByIdOptions,
  getCrmMainContractsByIdQueryKey,
  getCrmMainContractsQueryKey,
  patchCrmMainContractsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ContractForm } from '../../_components/contract-form';
import {
  type ContractFormSubmitValues,
  type ContractFormValues,
  DAYS_OF_WEEK,
  contractFormSchema,
} from '../../_schemas/contract-form.schema';
import { getContractEditState } from '../../_utils/contract-action-state';

interface ContractEditFormProps {
  id: string;
  defaultValues: ContractFormValues;
}

function ContractEditForm({ id, defaultValues }: Readonly<ContractEditFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<ContractFormValues, unknown, ContractFormSubmitValues>({
    resolver: zodResolver(contractFormSchema) as never,
    mode: 'onChange',
    defaultValues,
  });

  const updateMutation = useMutation({
    ...patchCrmMainContractsByIdMutation(),
    onSuccess: () => {
      toast.success('主契約を更新しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMainContractsQueryKey(),
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: getCrmMainContractsByIdQueryKey({ path: { id } }),
      });
      router.push(navigate('/contracts/[id]', id));
    },
    onError: () => {
      toast.error('主契約の更新に失敗しました');
    },
  });

  const onSubmit = (values: ContractFormSubmitValues) => {
    updateMutation.mutate({ path: { id }, body: values });
  };

  return (
    <Form {...form}>
      <ContractForm
        isEdit
        isSubmitting={updateMutation.isPending}
        onCancel={() => router.push(navigate('/contracts/[id]', id))}
        onSubmit={onSubmit}
      />
    </Form>
  );
}

export default function ContractEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmMainContractsByIdOptions({ path: { id: id ?? '' } }),
    enabled: Boolean(id),
  });

  const contract = data?.main_contract;
  const { canEdit, editBlockedMessage } = contract
    ? getContractEditState(contract)
    : { canEdit: false as const, editBlockedMessage: undefined };

  const defaultValues = useMemo<ContractFormValues | null>(() => {
    if (!contract) return null;
    return {
      name: contract.name,
      code: contract.code,
      contract_type: contract.contract_type as ContractFormValues['contract_type'],
      brand: contract.brand as ContractFormValues['brand'],
      other_store_usage: contract.other_store_usage as ContractFormValues['other_store_usage'],
      parent_contract_id: contract.parent_contract_id ?? null,
      old_code: contract.old_code ?? '',
      mutual_use: false,
      companion_benefit_enabled: contract.companion_benefit_enabled,
      public_name: contract.public_name,
      description: contract.description,
      company: contract.company ?? '',
      regulation: contract.regulation ?? '',
      public_description: contract.public_description,
      memo: contract.memo ?? '',
      price_including_tax: contract.price_including_tax,
      suspension_fee: contract.suspension_fee,
      tax_rate: contract.tax_rate,
      accounting_code: contract.accounting_code,
      start_date: contract.start_date,
      monthly_limit: contract.monthly_limit ?? null,
      suspension_monthly_limit: contract.suspension_monthly_limit ?? null,
      usage_hours_by_day:
        contract.usage_hours_by_day.length > 0
          ? (contract.usage_hours_by_day as ContractFormValues['usage_hours_by_day'])
          : DAYS_OF_WEEK.map((day) => ({ day, from: '00:00', to: '23:59', all_day: true })),
      suspendable_months: contract.suspendable_months,
      cancellable_months: contract.cancellable_months,
      initial_payment_months: contract.initial_payment_months,
      age_restriction: contract.age_restriction,
      gender_restriction: contract.gender_restriction,
      changeability: contract.changeability,
      billing_enabled: contract.billing_enabled,
      modifiable: contract.modifiable,
      same_day_cancellation: contract.same_day_cancellation,
      family_contract_allowed: contract.family_contract_allowed,
      status: contract.status as ContractFormValues['status'],
    };
  }, [contract]);

  return (
    <>
      <DataStateBoundary isLoading={isLoading} isError={isError} isEmpty={false} onRetry={refetch}>
        <PageHeader
          breadcrumb={<BackLink label="主契約管理に戻る" href={navigate('/contracts')} />}
          title="主契約 編集"
        />
        <div className="mx-auto max-w-240 p-4">
          {contract && !canEdit && (
            <Alert className="border-warning/50 bg-warning/10">
              <AlertDescription className="text-muted-foreground text-sm">
                {editBlockedMessage}
              </AlertDescription>
            </Alert>
          )}
          {defaultValues && id && canEdit && (
            <ContractEditForm key={contract?.id} id={id} defaultValues={defaultValues} />
          )}
        </div>
      </DataStateBoundary>
    </>
  );
}
