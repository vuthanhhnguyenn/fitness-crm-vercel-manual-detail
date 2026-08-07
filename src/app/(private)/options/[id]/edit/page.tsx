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
  getCrmOptionsByIdOptions,
  getCrmOptionsByIdQueryKey,
  getCrmOptionsQueryKey,
  patchCrmOptionsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmOptionsByIdResponse } from '@/lib/api/types.gen';
import { OptionType } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { OptionForm } from '../../_components/option-form';
import {
  type OptionFormSubmitValues,
  type OptionFormValues,
  optionFormSchema,
} from '../../_schemas/option-form.schema';

interface OptionEditFormProps {
  id: string;
  defaultValues: OptionFormValues;
}

function OptionEditForm({ id, defaultValues }: Readonly<OptionEditFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<OptionFormValues, unknown, OptionFormSubmitValues>({
    resolver: zodResolver(optionFormSchema) as never,
    mode: 'onChange',
    defaultValues,
  });

  const updateMutation = useMutation({
    ...patchCrmOptionsByIdMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'オプションを更新しました');
      queryClient.invalidateQueries({ queryKey: getCrmOptionsQueryKey(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: getCrmOptionsByIdQueryKey({ path: { id } }) });
      router.push(`/options/${id}`);
    },
    onError: () => {
      toast.error('オプションの更新に失敗しました');
    },
  });

  const onSubmit = (values: OptionFormSubmitValues) => {
    updateMutation.mutate({
      path: { id },
      body: {
        ...values,
        note: values.note.trim() || null,
        description: values.description.trim() || null,
        prorata_method: values.prorated_enabled ? values.prorata_method : null,
        tsuji_type: values.option_type === OptionType.METERED ? values.tsuji_type.trim() : null,
      },
    });
  };

  return (
    <div className="mx-auto max-w-240 p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
          <OptionForm
            isEdit
            isSubmitting={updateMutation.isPending}
            optionId={id}
            onCancel={() => router.push(`/options/${id}`)}
            onSubmit={onSubmit}
          />
        </form>
      </Form>
    </div>
  );
}

export default function OptionEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmOptionsByIdOptions({ path: { id: id ?? '' } }),
    enabled: Boolean(id),
  });

  const option = data?.option as GetCrmOptionsByIdResponse['option'] | undefined;

  const defaultValues = useMemo<OptionFormValues | null>(() => {
    if (!option) return null;

    return {
      brand: option.brand,
      name: option.name,
      code: option.code,
      option_category: option.option_category,
      accounting_code: option.accounting_code,
      note: option.note ?? '',
      description: option.description ?? '',
      member_app_image: option.member_app_image,
      price_including_tax: option.price_including_tax,
      tax_rate: option.tax_rate,
      prorated_enabled: option.prorated_enabled,
      prorata_method: option.prorata_method,
      option_type: option.option_type,
      tsuji_type: option.tsuji_type ?? '',
      usage_rule: option.usage_rule,
      constraint_main_option_change: option.constraint_main_option_change,
      constraint_change: option.constraint_change,
      area_restrictions: option.area_restrictions,
      status: option.status,
    };
  }, [option]);

  return (
    <>
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!option}
        onRetry={refetch}
      >
        <PageHeader
          breadcrumb={
            <BackLink label="オプション詳細に戻る" href={navigate('/options/[id]', id)} />
          }
          title="オプション 編集"
        />
        {defaultValues && id && <OptionEditForm id={id} defaultValues={defaultValues} />}
      </DataStateBoundary>
    </>
  );
}
