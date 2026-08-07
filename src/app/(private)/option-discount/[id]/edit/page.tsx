'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmMainContractsOptions,
  getCrmOptionDiscountsByIdOptions,
  getCrmOptionDiscountsByIdQueryKey,
  getCrmOptionDiscountsQueryKey,
  getCrmOptionsOptions,
  patchCrmOptionDiscountsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmOptionDiscountsByIdResponse,
  MainContractListItem,
  OptionMasterListItem,
} from '@/lib/api/types.gen';
import {
  OptionDiscountCondition,
  OptionDiscountStatus,
  OptionDiscountType,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { OptionDiscountForm } from '../../_components/option-discount-form';
import {
  type OptionDiscountFormSubmitValues,
  type OptionDiscountFormValues,
  optionDiscountFormSchema,
} from '../../_schemas/option-discount-form.schema';

type OptionDiscountDetail = NonNullable<GetCrmOptionDiscountsByIdResponse>['option_discount'];

interface OptionDiscountEditFormProps {
  id: string;
  defaultValues: OptionDiscountFormValues;
  contracts: MainContractListItem[];
  options: OptionMasterListItem[];
}

function OptionDiscountEditForm({
  id,
  defaultValues,
  contracts,
  options,
  onError,
}: Readonly<OptionDiscountEditFormProps & { onError?: () => void }>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<OptionDiscountFormValues, unknown, OptionDiscountFormSubmitValues>({
    resolver: zodResolver(optionDiscountFormSchema) as never,
    mode: 'onChange',
    defaultValues,
  });

  const updateMutation = useMutation({
    ...patchCrmOptionDiscountsByIdMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'セット割を更新しました');
      queryClient.invalidateQueries({
        queryKey: getCrmOptionDiscountsQueryKey(),
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: getCrmOptionDiscountsByIdQueryKey({ path: { id } }),
      });
      router.push(navigate('/option-discount/[id]', id));
    },
    onError: () => {
      toast.error('セット割の更新に失敗しました');
    },
  });

  const onSubmit = (values: OptionDiscountFormSubmitValues) => {
    const contractNames = values.target_contract_ids.map(
      (cid) => contracts.find((c) => c.id === cid)?.name ?? cid,
    );
    const optionNames = values.target_option_ids.map(
      (oid) => options.find((o) => o.id === oid)?.name ?? oid,
    );

    updateMutation.mutate({
      path: { id },
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
    <div className="mx-auto max-w-240 p-4">
      <Form {...form}>
        <form>
          <OptionDiscountForm
            isEdit
            isSubmitting={updateMutation.isPending}
            discountId={id}
            mainContracts={contracts}
            optionMasters={options}
            onCancel={() => router.push(navigate('/option-discount/[id]', id))}
            onSubmit={onSubmit}
            onError={onError}
          />
        </form>
      </Form>
    </div>
  );
}

export default function OptionDiscountEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmOptionDiscountsByIdOptions({ path: { id: id ?? '' } }),
    enabled: Boolean(id),
  });

  const detail = data?.option_discount as OptionDiscountDetail | undefined;
  const scrollToFirstError = useScrollToFirstError();

  const {
    data: mainContractsList,
    isLoading: isContractsLoading,
    isError: isContractsError,
    refetch: refetchContracts,
  } = useQuery({
    ...getCrmMainContractsOptions({ query: { page: 1, limit: 200, status: 'active' } }),
  });
  const {
    data: optionsList,
    isLoading: isOptionsLoading,
    isError: isOptionsError,
    refetch: refetchOptions,
  } = useQuery({
    ...getCrmOptionsOptions({ query: { page: 1, limit: 200, status: 'active' } }),
  });

  const isPageLoading = isLoading || isContractsLoading || isOptionsLoading;
  const isPageError = isError || isContractsError || isOptionsError;

  const contracts = useMemo(() => mainContractsList?.main_contracts ?? [], [mainContractsList]);
  const options = useMemo(() => optionsList?.options ?? [], [optionsList]);

  const defaultValues = useMemo<OptionDiscountFormValues | null>(() => {
    if (!detail || !mainContractsList || !optionsList) return null;

    const contractIds = detail.target_contracts
      .map((name) => contracts.find((c) => c.name === name)?.id)
      .filter(Boolean) as string[];

    const optionIds = detail.target_options
      .map((name) => options.find((o) => o.name === name)?.id)
      .filter(Boolean) as string[];

    return {
      name: detail.name,
      code: detail.code,
      description: detail.description ?? '',
      target_contract_ids: contractIds,
      target_option_ids: optionIds,
      discount_type: detail.discount_type as OptionDiscountType,
      discount_value: detail.discount_value,
      conditions: detail.conditions as OptionDiscountCondition,
      status: detail.status as OptionDiscountStatus,
    };
  }, [detail, mainContractsList, optionsList, contracts, options]);

  const handleRetry = () => {
    void refetch();
    void refetchContracts();
    void refetchOptions();
  };

  return (
    <>
      <DataStateBoundary
        isLoading={isPageLoading}
        isError={isPageError}
        isEmpty={!detail}
        onRetry={handleRetry}
      >
        <PageHeader
          breadcrumb={
            <BackLink label="セット割詳細に戻る" href={navigate('/option-discount/[id]', id)} />
          }
          title="セット割 編集"
        />
        {defaultValues && id && (
          <OptionDiscountEditForm
            id={id}
            defaultValues={defaultValues}
            contracts={contracts}
            options={options}
            onError={scrollToFirstError}
          />
        )}
      </DataStateBoundary>
    </>
  );
}
