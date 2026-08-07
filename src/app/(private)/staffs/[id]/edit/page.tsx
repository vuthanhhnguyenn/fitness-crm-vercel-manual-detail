'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';

import {
  getCrmStaffsByIdOptions,
  patchCrmStaffsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStaffsByIdResponse, PatchCrmStaffsByIdData } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LoginSettingsSection } from './_components/login-settings-section';
import { PermissionSettingsSection } from './_components/permission-settings-section';
import { PersonalInfoSection } from './_components/personal-info-section';
// ─── Schemas (externalized per rules) ─────────────────────────────────────────
import { type StaffEditFormValues, staffEditFormSchema } from './_schemas/staff-edit-form.schema';

export default function StaffEditPage() {
  return <StaffEditDataProvider />;
}

function StaffEditDataProvider() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const staffId = id ?? '';

  const { data, isLoading, isError } = useQuery({
    ...getCrmStaffsByIdOptions({ path: { id: staffId } }),
    enabled: Boolean(id),
  });

  if (!id) {
    return <div className="text-destructive p-6 text-sm">スタッフIDが不正です。</div>;
  }
  const staff = data?.staff as GetCrmStaffsByIdResponse['staff'] | undefined;

  if (isLoading) {
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
    };
  }, [staff]);

  const form = useForm<StaffEditFormValues>({
    resolver: zodResolver(staffEditFormSchema) as any,
    mode: 'onChange',
    values: {
      ...defaultValues,
      login_method: defaultValues?.login_method ?? 'email',
    } as StaffEditFormValues,
  });
  // Field arrays are handled inside section components

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

  const onSubmit = (values: StaffEditFormValues) => {
    const body: PatchCrmStaffsByIdData['body'] = {
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
      editable_scopes: values.editable_scopes.map((s) => ({
        brand: s.brand,
        target: s.target,
        store_id: s.target === 'specific_store' ? s.store_id || undefined : undefined,
        store_name: s.target === 'specific_store' ? s.store_name || undefined : undefined,
        start_date: s.start_date,
        end_date: s.end_date || undefined,
      })),
    };

    mutation.mutate({
      path: { id },
      body,
    });
  };

  return (
    <div className="">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[{ url: '/staffs', label: 'スタッフ管理' }, { label: 'スタッフ編集' }]}
          variant="section"
        />
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-lg font-semibold">スタッフ編集</h1>
        </div>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <PersonalInfoSection />
            <LoginSettingsSection />
            <PermissionSettingsSection />
          </form>
        </Form>
        <div className="fixed right-0 bottom-0 left-0 border-t bg-white px-4 py-4">
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => router.back()}>
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
