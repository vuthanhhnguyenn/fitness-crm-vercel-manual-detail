'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { getCrmMembersQueryKey, postCrmMembersMutation } from '@/lib/api/@tanstack/react-query.gen';
import type { PostCrmMembersData } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { MembersForm } from '../_components/members-form';
import {
  type MemberFormSubmitValues,
  type MemberFormValues,
  emptyMemberFormValues,
  memberFormSchema,
} from '../_schemas/member-form.schema';
import { normalizePostalCode, trimOrUndefined } from '../_utils';

type MemberProfileContractName = NonNullable<
  NonNullable<PostCrmMembersData['body']>['profile_info']
>['contract_name'];

export default function MemberCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<MemberFormValues, unknown, MemberFormSubmitValues>({
    resolver: zodResolver(memberFormSchema) as any,
    mode: 'onSubmit',
    defaultValues: emptyMemberFormValues,
  });

  const createMutation = useMutation(postCrmMembersMutation());

  const handleSubmit = form.handleSubmit(async (values) => {
    const nameKanji = `${values.last_name} ${values.first_name}`.trim();
    const nameKana = `${values.last_name_kana} ${values.first_name_kana}`.trim();

    try {
      const response = await createMutation.mutateAsync({
        body: {
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

      const memberId = response.member?.id;
      if (!memberId) {
        throw new Error('会員IDを取得できませんでした');
      }

      toast.success('会員を作成しました');
      await queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
      router.push(navigate('/members/[id]', memberId));
    } catch {
      toast.error('会員の作成に失敗しました');
    }
  }, scrollToFirstError);

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[{ url: navigate('/members'), label: '会員管理' }, { label: '会員新規登録' }]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-28">
        <div className="py-4">
          <h1 className="text-xl font-bold">会員新規登録</h1>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <MembersForm />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(navigate('/members'))}>
            キャンセル
          </Button>
          <Button type="button" disabled={createMutation.isPending} onClick={handleSubmit}>
            {createMutation.isPending ? '登録中...' : '登録する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
