'use client';

import { useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard.hook';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Form } from '@/components/ui/form';

import {
  getCrmFranchiseCompaniesQueryKey,
  postCrmFranchiseCompaniesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { FranchiseCompanyDiscardDialog } from '../_components/franchise-company-discard-dialog';
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
  auth_method: undefined as unknown as FranchiseCompanyFormValues['auth_method'],
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
  const isSubmittingRef = useRef(false);

  const form = useForm<FranchiseCompanyFormValues, unknown, FranchiseCompanyFormSubmitValues>({
    resolver: zodResolver(franchiseCompanyFormSchema) as never,
    mode: 'onChange',
    defaultValues: emptyDefaults,
  });

  const formIsDirty = form.formState.isDirty;
  const {
    confirmDiscard,
    discardDialogOpen,
    handleDiscardConfirm,
    handleDiscardCancel,
    navigateAfterSave,
  } = useUnsavedChangesGuard(formIsDirty);

  const navigateToList = useCallback(() => {
    router.push(navigate('/franchise-companies'));
  }, [router]);

  const handleCancel = useCallback(() => {
    confirmDiscard(navigateToList);
  }, [confirmDiscard, navigateToList]);

  const createMutation = useMutation({
    ...postCrmFranchiseCompaniesMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'FC企業を作成しました');
      queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesQueryKey(),
      });
      navigateAfterSave(navigateToList);
    },
    onError: () => {
      toast.error('FC企業の作成に失敗しました');
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const onSubmit = (values: FranchiseCompanyFormSubmitValues) => {
    // Ref guard (not just `createMutation.isPending`): two clicks dispatched in the
    // same tick both read the pre-mutate render state, so a state-only guard can
    // still let a second POST through.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    createMutation.mutate({
      body: {
        formal_name: values.formal_name.trim(),
        display_name: values.display_name.trim() || values.formal_name.trim(),
        type: values.type,
        auth_method: values.auth_method,
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

  // react-hook-form's handleSubmit never invokes onSubmit synchronously during
  // render — it only returns a closure invoked later on the submit event — so
  // isSubmittingRef is never actually read during render.
  // eslint-disable-next-line react-hooks/refs
  const handleFormSubmit = form.handleSubmit(onSubmit, scrollToFirstError);

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="FC企業管理に戻る" onClick={handleCancel} />}
        title="FC企業新規登録"
      />
      <div className="mx-auto w-full max-w-240 p-4">
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="w-full">
            <FranchiseCompanyForm
              mode="create"
              isSubmitting={createMutation.isPending}
              onCancel={handleCancel}
              onSubmit={onSubmit}
              onError={scrollToFirstError}
            />
          </form>
        </Form>
      </div>
      <FranchiseCompanyDiscardDialog
        open={discardDialogOpen}
        onOpenChange={handleDiscardCancel}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </>
  );
}
