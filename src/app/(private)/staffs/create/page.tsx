'use client';

import { useMemo } from 'react';
import { type DefaultValues, useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmFranchiseCompaniesOptions,
  getCrmStaffsOptions,
  getCrmStaffsQueryKey,
  getCrmStoresOptions,
  postCrmStaffsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { AffiliationSection } from './_components/affiliation-section';
import { NoteSection } from './_components/note-section';
import { PermissionSection } from './_components/permission-section';
import { StaffRowsSection } from './_components/staff-rows-section';
import { type StaffCreateFormValues, staffCreateFormSchema } from './_schemas/staff-create.schema';
import {
  buildCreateStaffPayload,
  getSubmitErrorMessage,
  hasAnyDuplicate,
} from './_utils/staff-create.util';

const DEFAULT_VALUES: DefaultValues<StaffCreateFormValues> = {
  rows: [{ last_name: '', first_name: '', email: '' }],
  role: undefined,
  position_id: undefined,
  affiliation_type: 'direct_store',
  store_id: '',
  fc_company_id: '',
  note: '',
};

export default function StaffCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<StaffCreateFormValues>({
    resolver: zodResolver(staffCreateFormSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });
  const rows = useWatch({ control: form.control, name: 'rows' });
  const fcCompanyId = useWatch({ control: form.control, name: 'fc_company_id' });

  const filledRowCount = rows.filter(
    (row) => row.last_name.trim() || row.first_name.trim() || row.email.trim(),
  ).length;

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(form.formState.isDirty);

  const handleCancel = () => confirmDiscard(() => router.push(navigate('/staffs')));

  const { data: allStaffsRes } = useQuery(getCrmStaffsOptions({ query: { page: 1, limit: 500 } }));
  const existingEmails = useMemo(
    () => new Set((allStaffsRes?.staffs ?? []).map((s) => s.email.toLowerCase())),
    [allStaffsRes],
  );

  const { data: storesRes } = useQuery(
    getCrmStoresOptions({ query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' } }),
  );
  const stores = storesRes?.stores ?? [];

  const { data: fcRes } = useQuery(
    getCrmFranchiseCompaniesOptions({ query: { page: 1, limit: 100, company_type: 'fc' } }),
  );
  const fcCompanies = fcRes?.franchise_companies ?? [];
  const selectedFc = fcCompanies.find((fc) => fc.id === fcCompanyId);

  const hasDuplicate = hasAnyDuplicate(rows, existingEmails);

  const createMutation = useMutation({
    ...postCrmStaffsMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'スタッフを登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmStaffsQueryKey() });
      router.push(navigate('/staffs'));
    },
    onError: () => {
      toast.error('スタッフの登録に失敗しました');
    },
  });

  const onSubmit = async (values: StaffCreateFormValues) => {
    if (hasDuplicate) {
      scrollToFirstError();
      return;
    }
    try {
      await createMutation.mutateAsync({
        body: buildCreateStaffPayload(values, stores, selectedFc),
      });
    } catch {
      // user feedback handled by mutation.onError
    }
  };

  const submitErrorMessage = getSubmitErrorMessage(
    form.formState.isSubmitted,
    hasDuplicate,
    Object.keys(form.formState.errors).length > 0,
  );

  const isSubmitDisabled =
    filledRowCount === 0 || form.formState.isSubmitting || createMutation.isPending;

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="スタッフ管理に戻る" onClick={handleCancel} />}
        title="スタッフ新規登録"
      />

      <Form {...form}>
        <form
          className="mx-auto flex max-w-[960px] flex-col gap-6 px-6 py-4"
          onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}
        >
          <StaffRowsSection existingEmails={existingEmails} />
          <PermissionSection />
          <AffiliationSection />
          <NoteSection />

          <Alert>
            <AlertDescription className="text-xs">
              登録後、各スタッフのメールアドレスに初期パスワードが自動送信されます。スタッフは受信したメールに記載のパスワードでCRMにログインできます。
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-end gap-2 border-t p-4">
            {submitErrorMessage && (
              <p className="text-destructive mr-auto text-xs">{submitErrorMessage}</p>
            )}
            <Button size="lg" variant="outline" type="button" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button size="lg" type="submit" disabled={isSubmitDisabled}>
              {filledRowCount > 0 ? `${filledRowCount}名を登録する` : '登録する'}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={discardDialogOpen} onOpenChange={handleDiscardCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              未保存の変更はすべて失われます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardCancel}>編集を続ける</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>破棄する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
