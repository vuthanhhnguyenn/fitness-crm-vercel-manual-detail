'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmStaffsByIdOptions,
  patchCrmStaffsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStaffsByIdResponse, PatchCrmStaffsByIdData } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { AffiliationSection } from './_components/affiliation-section';
import { LoginSettingsSection } from './_components/login-settings-section';
import { PermissionSettingsSection } from './_components/permission-settings-section';
import { PersonalInfoSection } from './_components/personal-info-section';
import { RoleChangeConfirmDialog } from './_components/role-change-confirm-dialog';
// ─── Schemas (externalized per rules) ─────────────────────────────────────────
import { type StaffEditFormValues, staffEditFormSchema } from './_schemas/staff-edit-form.schema';

export default function StaffEditPage() {
  return <StaffEditDataProvider />;
}

/** Exact message `canRead()` in `api/crm/staffs/[id]/route.ts` returns for a 403. */
const STAFF_DETAIL_FORBIDDEN_MESSAGE = 'このスタッフ情報を閲覧する権限がありません';

function StaffEditDataProvider() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const staffId = id ?? '';

  const { data, isLoading, isError, error } = useQuery({
    ...getCrmStaffsByIdOptions({ path: { id: staffId } }),
    enabled: Boolean(id),
  });

  const isForbidden =
    (error as { error?: string } | null)?.error === STAFF_DETAIL_FORBIDDEN_MESSAGE;

  useEffect(() => {
    if (isForbidden) {
      router.replace(navigate('/403'));
    }
  }, [isForbidden, router]);

  if (!id) {
    return <div className="text-destructive p-6 text-sm">スタッフIDが不正です。</div>;
  }
  const staff = data?.staff as GetCrmStaffsByIdResponse['staff'] | undefined;

  if (isLoading || isForbidden) {
    return <StaffEditPageSkeleton />;
  }

  if (isError || !staff) {
    return <div className="text-destructive p-6 text-sm">スタッフ情報の取得に失敗しました。</div>;
  }

  return <StaffEditFormContent id={id} staff={staff} />;
}

function StaffEditFormContent({
  id,
  staff,
}: {
  id: string;
  staff: GetCrmStaffsByIdResponse['staff'];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasRole } = useAuthUser();
  const canChangeRole = hasRole([UserRole.Headquarter, UserRole.System]);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);

  const defaultValues = useMemo<StaffEditFormValues>(() => {
    return {
      last_name: staff.personal_info.last_name,
      first_name: staff.personal_info.first_name,
      last_name_kana: staff.personal_info.last_name_kana ?? '',
      first_name_kana: staff.personal_info.first_name_kana ?? '',
      gender: staff.personal_info.gender ?? '',
      birthday: staff.personal_info.birthday ?? '',
      phone: staff.personal_info.phone ?? '',
      email: staff.personal_info.email,
      postal_code: staff.personal_info.postal_code ?? '',
      prefecture: staff.personal_info.prefecture ?? '',
      city: staff.personal_info.city ?? '',
      address: staff.personal_info.address ?? '',
      building: staff.personal_info.building ?? '',
      login_method: staff.login_settings.login_method,
      social_id: staff.login_settings.social_id ?? '',
      role: staff.permission_settings.role,
      position_id: staff.position_id,
      billing_correction: staff.permission_settings.additional_permissions.billing_correction,
      refund_request: staff.permission_settings.additional_permissions.refund_request,
      transfer_request: staff.permission_settings.additional_permissions.transfer_request,
      editable_scopes: staff.editable_scopes.map((s) => ({
        brand: s.brand,
        target: s.target,
        store_id: s.store_id ?? '',
        store_name: s.store_name ?? '',
        start_date: s.start_date,
        end_date: s.end_date ?? '',
      })),
      affiliation_type: staff.staff_linkage.type,
      affiliation_store_id:
        staff.staff_linkage.type === 'direct_store' ? (staff.staff_linkage.store_id ?? '') : '',
      affiliation_fc_company_id:
        staff.staff_linkage.type === 'fc_company' ? (staff.staff_linkage.fc_company_id ?? '') : '',
      note: staff.note ?? '',
    };
  }, [staff]);

  const form = useForm<StaffEditFormValues>({
    // TODO(CODE-RULE-I): zodResolver's inferred Resolver type conflicts with a duplicate
    // react-hook-form type declaration pulled in transitively; pre-existing before this feature.
    resolver: zodResolver(staffEditFormSchema) as any,
    mode: 'onChange',
    values: {
      ...defaultValues,
      login_method: defaultValues?.login_method ?? 'email',
    } as StaffEditFormValues,
  });

  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(form.formState.isDirty);

  const mutation = useMutation({
    ...patchCrmStaffsByIdMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'スタッフ情報を更新しました');
      queryClient.invalidateQueries({
        queryKey: getCrmStaffsByIdOptions({ path: { id } }).queryKey,
      });
      router.push(navigate('/staffs/[id]', id));
    },
    onError: () => {
      toast.error('更新に失敗しました');
    },
  });

  const scrollToFirstError = useScrollToFirstError();

  const buildRequestBody = (values: StaffEditFormValues): PatchCrmStaffsByIdData['body'] => ({
    personal_info: {
      last_name: values.last_name,
      first_name: values.first_name,
      last_name_kana: values.last_name_kana || undefined,
      first_name_kana: values.first_name_kana || undefined,
      gender: values.gender || undefined,
      birthday: values.birthday || undefined,
      phone: values.phone || undefined,
      email: values.email,
      postal_code: values.postal_code || undefined,
      prefecture: values.prefecture || undefined,
      city: values.city || undefined,
      address: values.address || undefined,
      building: values.building || undefined,
    },
    role: values.role,
    login_settings: {
      login_method: values.login_method,
      social_id: values.social_id || undefined,
    },
    position_id: values.position_id,
    permission_settings: {
      role: values.role,
      additional_permissions: {
        billing_correction: values.billing_correction,
        refund_request: values.refund_request,
        transfer_request: values.transfer_request,
      },
    },
    staff_linkage:
      values.affiliation_type === 'direct_store'
        ? { type: 'direct_store', store_id: values.affiliation_store_id || undefined }
        : { type: 'fc_company', fc_company_id: values.affiliation_fc_company_id || undefined },
    note: values.note || undefined,
    editable_scopes: values.editable_scopes.map((s) => ({
      brand: s.brand,
      target: s.target,
      store_id: s.target === 'specific_store' ? s.store_id || undefined : undefined,
      store_name: s.target === 'specific_store' ? s.store_name || undefined : undefined,
      start_date: s.start_date,
      end_date: s.end_date || undefined,
    })),
  });

  const submitUpdate = (values: StaffEditFormValues) => {
    mutation.mutate({ path: { id }, body: buildRequestBody(values) });
  };

  const onSubmit = (values: StaffEditFormValues) => {
    const isRoleChanged = values.role !== staff.permission_settings.role;
    if (isRoleChanged) {
      setRoleChangeDialogOpen(true);
      return;
    }
    submitUpdate(values);
  };

  const handleRoleChangeConfirm = () => {
    setRoleChangeDialogOpen(false);
    submitUpdate(form.getValues());
  };

  const handleCancel = () => confirmDiscard(() => router.push(navigate('/staffs/[id]', id)));

  const watchedRole = useWatch({ control: form.control, name: 'role' });

  return (
    <div className="">
      <PageHeader
        breadcrumb={<BackLink label="スタッフ管理に戻る" onClick={handleCancel} />}
        title="スタッフ編集"
      />
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-24">
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <PersonalInfoSection staffId={id} />
            <LoginSettingsSection />
            <PermissionSettingsSection canChangeRole={canChangeRole} />
            <AffiliationSection />
            <Card>
              <CardHeader>
                <CardTitle>備考</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <Textarea
                  placeholder="備考を入力してください（任意）"
                  className="min-h-[100px] text-sm leading-relaxed"
                  maxLength={1000}
                  {...form.register('note')}
                />
              </CardContent>
            </Card>
          </form>
        </Form>
        <div className="fixed right-0 bottom-0 left-0 border-t bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
              <p className="text-destructive text-xs">未入力の項目があります</p>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" type="button" onClick={handleCancel}>
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit, scrollToFirstError)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? '保存中...' : '保存する'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RoleChangeConfirmDialog
        open={roleChangeDialogOpen}
        onOpenChange={setRoleChangeDialogOpen}
        previousRole={staff.permission_settings.role}
        nextRole={watchedRole}
        onConfirm={handleRoleChangeConfirm}
        isPending={mutation.isPending}
      />

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
    </div>
  );
}

function StaffEditPageSkeleton() {
  return (
    <div className="">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="py-4">
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
