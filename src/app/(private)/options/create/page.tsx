'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import { getCrmOptionsQueryKey, postCrmOptionsMutation } from '@/lib/api/@tanstack/react-query.gen';
import { OptionStatus, OptionType, OptionUsageRule } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { OptionForm } from '../_components/option-form';
import {
  type OptionFormSubmitValues,
  type OptionFormValues,
  optionFormSchema,
} from '../_schemas/option-form.schema';

const emptyDefaults: OptionFormValues = {
  brand: undefined as unknown as OptionFormValues['brand'],
  name: '',
  code: '',
  option_category: undefined as unknown as OptionFormValues['option_category'],
  accounting_code: '',
  note: '',
  description: '',
  member_app_image: null,
  price_including_tax: undefined as unknown as number,
  tax_rate: undefined as unknown as number,
  prorated_enabled: false,
  prorata_method: null,
  option_type: OptionType.STANDARD as OptionFormValues['option_type'],
  tsuji_type: '',
  usage_rule: OptionUsageRule.ADD_REMOVE_CHANGE,
  constraint_main_option_change: false,
  constraint_change: false,
  area_restrictions: [],
  status: OptionStatus.ACTIVE,
};

export default function OptionCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<OptionFormValues, unknown, OptionFormSubmitValues>({
    resolver: zodResolver(optionFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyDefaults,
  });

  const createMutation = useMutation({
    ...postCrmOptionsMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'オプションを作成しました');
      queryClient.invalidateQueries({ queryKey: getCrmOptionsQueryKey(), refetchType: 'all' });
      router.push(navigate(`/options/[id]`, res.option.id));
    },
    onError: () => {
      toast.error('オプションの作成に失敗しました');
    },
  });

  const onSubmit = (values: OptionFormSubmitValues) => {
    createMutation.mutate({
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
    <>
      <PageHeader
        breadcrumb={<BackLink label="オプション管理に戻る" href={navigate('/options')} />}
        title="オプション 新規登録"
      />
      <div className="mx-auto max-w-240 p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <OptionForm
              isSubmitting={createMutation.isPending}
              onCancel={() => router.push(navigate('/options'))}
              onSubmit={onSubmit}
            />
          </form>
        </Form>
      </div>
    </>
  );
}
