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

import {
  getCrmFranchiseCompaniesQueryKey,
  postCrmFranchiseCompaniesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { FranchiseCompanyForm } from '../_components/franchise-company-form';
import {
  type FranchiseCompanyFormSubmitValues,
  type FranchiseCompanyFormValues,
  franchiseCompanyFormSchema,
} from '../_schemas/franchise-company-form.schema';

const emptyDefaults: FranchiseCompanyFormValues = {
  formal_name: '',
  display_name: '',
  type: undefined as unknown as FranchiseCompanyFormValues['type'],
  direct_owned_flag: false,
  corporate_number: '',
  representative_name: '',
  head_office_address: '',
  phone: '',
  contact_person: '',
  contact_phone: '',
  fc_contract_start_date: '',
  fc_contract_renewal_date: '',
  royalty_rate: undefined,
  note: '',
  status: 'active',
};

export default function FranchiseCompanyCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<FranchiseCompanyFormValues, unknown, FranchiseCompanyFormSubmitValues>({
    resolver: zodResolver(franchiseCompanyFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyDefaults,
  });

  const createMutation = useMutation({
    ...postCrmFranchiseCompaniesMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'FC企業を作成しました');
      queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesQueryKey(),
        refetchType: 'all',
      });
      router.push(navigate('/franchise-companies'));
    },
    onError: () => {
      toast.error('FC企業の作成に失敗しました');
    },
  });

  const onSubmit = (values: FranchiseCompanyFormSubmitValues) => {
    createMutation.mutate({
      body: {
        formal_name: values.formal_name.trim(),
        display_name: values.display_name.trim() || values.formal_name.trim(),
        type: values.type,
        direct_owned_flag: values.direct_owned_flag,
        corporate_number: values.corporate_number.trim() || null,
        representative_name: values.representative_name.trim() || null,
        head_office_address: values.head_office_address.trim() || null,
        phone: values.phone.trim() || null,
        contact_person: values.contact_person.trim() || null,
        contact_phone: values.contact_phone.trim() || null,
        fc_contract_start_date: values.fc_contract_start_date || null,
        fc_contract_renewal_date: values.fc_contract_renewal_date || null,
        royalty_rate: values.royalty_rate ?? null,
        note: values.note.trim() || null,
        status: values.status,
      },
    });
  };

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="FC企業管理に戻る" href={navigate('/franchise-companies')} />}
        title="FC企業新規登録"
      />
      <div className="mx-auto max-w-240 p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <FranchiseCompanyForm
              isSubmitting={createMutation.isPending}
              onCancel={() => router.push(navigate('/franchise-companies'))}
              onSubmit={onSubmit}
              onError={scrollToFirstError}
            />
          </form>
        </Form>
      </div>
    </>
  );
}
