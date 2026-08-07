'use client';

import { useEffect, useMemo } from 'react';
import { useForm, useFormState } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmMembersByIdOptions,
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  patchCrmMembersByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import {
  Gender,
  type GetMemberDetailResponse,
  type PatchCrmMembersByIdData,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { MembersForm } from '../../_components/members-form';
import {
  JOIN_ROUTE_OPTIONS,
  type MemberFormSubmitValues,
  type MemberFormValues,
  emptyMemberFormValues,
  memberFormSchema,
} from '../../_schemas/member-form.schema';
import { normalizePostalCode, trimOrUndefined } from '../../_utils';

const splitName = (name?: string) => {
  if (!name) return { last: '', first: '' };
  const [last, ...rest] = name.trim().split(/\s+/);
  return { last: last ?? '', first: rest.join(' ') };
};

type MemberProfileContractName = NonNullable<
  NonNullable<PatchCrmMembersByIdData['body']>['profile_info']
>['contract_name'];

const mapMemberDetailToFormValues = (member: GetMemberDetailResponse): MemberFormValues => ({
  ...(() => {
    const kanji = splitName(member.basic_info.name_kanji);
    const kana = splitName(member.basic_info.name_kana);
    return {
      last_name: kanji.last,
      first_name: kanji.first,
      last_name_kana: kana.last,
      first_name_kana: kana.first,
    };
  })(),
  gender: member.basic_info.gender ?? Gender.OTHER,
  birthday: member.basic_info.birthday ?? '',
  member_type: member.profile?.member_type ?? '',
  phone: member.basic_info.phone,
  email: member.basic_info.email,
  postal_code: member.basic_info.postal_code ?? '',
  address: member.basic_info.address ?? '',
  emergency_contact_name: member.basic_info.emergency_contact?.name ?? '',
  emergency_contact_relationship: member.basic_info.emergency_contact?.relationship ?? '',
  emergency_contact_phone: member.basic_info.emergency_contact?.phone ?? '',
  contract_name: member.profile?.contract_name ?? '',
  join_date: member.profile?.joined_at ?? '',
  join_store: member.profile?.store_id ?? '',
  brand: member.profile?.brand ?? '',
  join_route:
    member.profile?.join_route && JOIN_ROUTE_OPTIONS.includes(member.profile.join_route as any)
      ? (member.profile.join_route as (typeof JOIN_ROUTE_OPTIONS)[number])
      : '',
  referrer_member_id: member.profile?.referrer_member_id ?? '',
  member_photo_url: member.ekyc?.photoUrl ?? '',
  notes: member.basic_info.notes ?? '',
});

export default function MemberEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const scrollToFirstError = useScrollToFirstError();

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmMembersByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const member = data;

  const defaultValues = useMemo<MemberFormValues>(() => {
    if (!member) {
      return emptyMemberFormValues;
    }
    return mapMemberDetailToFormValues(member);
  }, [member]);

  const form = useForm<MemberFormValues, unknown, MemberFormSubmitValues>({
    resolver: zodResolver(memberFormSchema) as any,
    mode: 'onSubmit',
    defaultValues,
  });

  useEffect(() => {
    if (!member) return;
    form.reset(defaultValues);
  }, [defaultValues, form, member]);

  const { isDirty } = useFormState({ control: form.control });

  const updateMutation = useMutation({
    ...patchCrmMembersByIdMutation(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCrmMembersByIdQueryKey({ path: { id } }) }),
        queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey(), refetchType: 'all' }),
      ]);
      toast.success('会員情報を更新しました');
      router.push(navigate('/members/[id]', id));
    },
    onError: () => {
      toast.error('会員情報の更新に失敗しました');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    if (!isDirty) return;
    const nameKanji = `${values.last_name} ${values.first_name}`.trim();
    const nameKana = `${values.last_name_kana} ${values.first_name_kana}`.trim();

    updateMutation.mutate({
      path: { id },
      body: {
        basic_info: {
          name_kanji: nameKanji,
          name_kana: nameKana,
          gender: values.gender,
          birthday: trimOrUndefined(values.birthday),
          postal_code: normalizePostalCode(values.postal_code),
          address: trimOrUndefined(values.address),
          phone: values.phone.trim(),
          email: values.email.trim(),
          emergency_contact:
            values.emergency_contact_name ||
            values.emergency_contact_relationship ||
            values.emergency_contact_phone
              ? {
                  name: trimOrUndefined(values.emergency_contact_name) ?? '',
                  relationship: trimOrUndefined(values.emergency_contact_relationship) ?? '',
                  phone: trimOrUndefined(values.emergency_contact_phone) ?? '',
                }
              : undefined,
          notes: trimOrUndefined(values.notes),
        },
        profile_info: {
          member_type: values.member_type || undefined,
          contract_name: values.contract_name as MemberProfileContractName,
          join_date: trimOrUndefined(values.join_date),
          join_store: trimOrUndefined(values.join_store),
          brand: trimOrUndefined(values.brand),
          join_route: trimOrUndefined(values.join_route),
          referrer_member_id: trimOrUndefined(values.referrer_member_id),
          photo_url: trimOrUndefined(values.member_photo_url),
        },
      },
    });
  }, scrollToFirstError);

  if (isLoading || isError || !member) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!member}
        onRetry={() => refetch()}
        errorTitle="会員情報の取得に失敗しました"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[{ url: navigate('/members'), label: '会員管理' }, { label: '会員編集' }]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-28">
        <div className="py-4">
          <h1 className="text-xl font-bold">会員編集</h1>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <MembersForm />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(navigate('/members/[id]', id))}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={!isDirty || updateMutation.isPending}
            onClick={handleSubmit}
          >
            {updateMutation.isPending ? '保存中...' : '保存する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
