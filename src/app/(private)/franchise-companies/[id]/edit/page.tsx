'use client';

import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmFranchiseCompaniesByIdOptions,
  getCrmFranchiseCompaniesByIdQueryKey,
  getCrmFranchiseCompaniesQueryKey,
  patchCrmFranchiseCompaniesByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmFranchiseCompaniesByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { FranchiseCompanyForm } from '../../_components/franchise-company-form';
import {
  type FranchiseCompanyFormSubmitValues,
  type FranchiseCompanyFormValues,
  franchiseCompanyFormSchema,
} from '../../_schemas/franchise-company-form.schema';

type FranchiseCompanyDetail =
  NonNullable<GetCrmFranchiseCompaniesByIdResponse>['franchise_company'];

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

function toFormDefaults(company: FranchiseCompanyDetail): FranchiseCompanyFormValues {
  return {
    formal_name: company.formal_name,
    display_name: company.display_name,
    type: company.type,
    direct_owned_flag: company.direct_owned_flag,
    corporate_number: company.corporate_number ?? '',
    representative_name: company.representative_name ?? '',
    head_office_address: company.head_office_address ?? '',
    phone: company.phone ?? '',
    contact_person: company.contact_person ?? '',
    contact_phone: company.contact_phone ?? '',
    fc_contract_start_date: company.fc_contract_start_date ?? '',
    fc_contract_renewal_date: company.fc_contract_renewal_date ?? '',
    royalty_rate: company.royalty_rate ?? undefined,
    note: company.note ?? '',
    status: company.status,
  };
}

function FranchiseCompanyEditPageContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const companyId = params.id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmFranchiseCompaniesByIdOptions({ path: { id: companyId } }),
  });

  const company = data?.franchise_company as FranchiseCompanyDetail | undefined;

  const form = useForm<FranchiseCompanyFormValues, unknown, FranchiseCompanyFormSubmitValues>({
    resolver: zodResolver(franchiseCompanyFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (company) {
      form.reset(toFormDefaults(company));
    }
  }, [company, form]);

  const updateMutation = useMutation({
    ...patchCrmFranchiseCompaniesByIdMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'FC企業を更新しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesQueryKey(),
        refetchType: 'all',
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesByIdQueryKey({ path: { id: companyId } }),
        refetchType: 'all',
      });
      router.push(navigate('/franchise-companies/[id]', companyId));
    },
    onError: () => {
      toast.error('FC企業の更新に失敗しました');
    },
  });

  const onSubmit = (values: FranchiseCompanyFormSubmitValues) => {
    updateMutation.mutate({
      path: { id: companyId },
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

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !company) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!company}
        onRetry={() => refetch()}
        emptyTitle="FC企業が見つかりません"
      />
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink
            label="FC企業詳細に戻る"
            href={navigate('/franchise-companies/[id]', companyId)}
          />
        }
        title="FC企業編集"
      />
      <div className="mx-auto max-w-240 p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <FranchiseCompanyForm
              isSubmitting={updateMutation.isPending}
              onCancel={() => router.push(navigate('/franchise-companies/[id]', companyId))}
              onSubmit={onSubmit}
              onError={scrollToFirstError}
              submitPermission={Permission.FCCompaniesEdit}
            />
          </form>
        </Form>
      </div>
    </>
  );
}

export default function FranchiseCompanyEditPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FranchiseCompanyEditPageContent />
    </Suspense>
  );
}
