'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Resolver, useForm, useFormState } from 'react-hook-form';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes.hook';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmMembersByIdOptions,
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  patchCrmMembersByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { type GetMemberDetailResponse, MemberStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { MemberEditDiscardDialog } from '../../_components/member-edit-discard-dialog';
import { MembersForm } from '../../_components/members-form';
import {
  type MemberFormSubmitValues,
  type MemberFormValues,
  emptyMemberFormValues,
  memberFormSchema,
} from '../../_schemas/member-form.schema';
import { normalizePostalCode, trimOrUndefined } from '../../_utils';

const mapMemberDetailToFormValues = (member: GetMemberDetailResponse): MemberFormValues => {
  const personalInfo = member.personalInfo;
  // Q11: the form carries ONE address string; join the stored
  // parts for display. On save the whole string goes to `address` and the
  // decomposed parts are cleared so the round-trip stays stable.
  const address = [
    personalInfo.prefecture,
    personalInfo.city,
    personalInfo.streetAddress,
    personalInfo.building,
  ]
    .filter(Boolean)
    .join('');

  return {
    last_name: personalInfo.lastName ?? '',
    first_name: personalInfo.firstName ?? '',
    last_name_kana: personalInfo.lastNameKana ?? '',
    first_name_kana: personalInfo.firstNameKana ?? '',
    birthday: personalInfo.dateOfBirth ?? '',
    gender: personalInfo.gender ?? ('' as MemberFormValues['gender']),
    postal_code: personalInfo.postalCode ?? '',
    address,
    phone: personalInfo.phone ?? '',
    email: personalInfo.email ?? '',
  };
};

export default function MemberEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const scrollToFirstError = useScrollToFirstError();

  // A-01 FR-004 / FR-032: page-level gate — same MembersEdit permission as the
  // route guard and entry points, independent of the server-side rejection.
  const { hasPermission, isLoading: isAuthLoading } = useAuthUser();
  const canEdit = hasPermission(Permission.MembersEdit);

  // FR-018: footer summary shown after a failed submit; re-evaluated only on
  // the next submit (Q5 — it intentionally outlives the inline messages).
  const [submitFailed, setSubmitFailed] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmMembersByIdOptions({ path: { id } }),
    enabled: Boolean(id) && canEdit,
  });

  const member = data;

  const defaultValues = useMemo<MemberFormValues>(() => {
    if (!member) {
      return emptyMemberFormValues;
    }
    return mapMemberDetailToFormValues(member);
  }, [member]);

  const form = useForm<MemberFormValues, unknown, MemberFormSubmitValues>({
    resolver: zodResolver(memberFormSchema) as Resolver<
      MemberFormValues,
      unknown,
      MemberFormSubmitValues
    >,
    // FR-015: validate on submit only; FR-019: a flagged field re-validates
    // (and clears) as soon as the user changes it.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    if (!member) return;
    form.reset(mapMemberDetailToFormValues(member));
  }, [form, member]);

  // FR-020: any change marks the screen dirty for the discard guard.
  const { isDirty } = useFormState({ control: form.control });
  const { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel } =
    useUnsavedChanges(isDirty);

  const updateMutation = useMutation({
    ...patchCrmMembersByIdMutation(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCrmMembersByIdQueryKey({ path: { id } }) }),
        queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() }),
      ]);
      // FR-022: the saved values become the new baseline, so the form is no longer
      // dirty and nothing warns on the way out.
      form.reset(form.getValues());
      toast.success('会員情報を更新しました');
      router.push(navigate('/members/[id]', id));
    },
    onError: () => {
      // FR-031: stay on the form with the entered values (and dirty state) intact.
      toast.error('会員情報の更新に失敗しました');
    },
  });

  const handleSubmit = form.handleSubmit(
    (values) => {
      setSubmitFailed(false);

      // FR-024 / Q10: only the eight FR-004 field groups are sent (basic_info);
      // profile_info / emergency_contact / notes are never touched by this screen.
      // Family and given name go up as four separate fields — joining them into one
      // string would throw away the boundary the form already captured (QA09 §2.3).
      updateMutation.mutate({
        path: { id },
        body: {
          basic_info: {
            last_name: values.last_name.trim(),
            first_name: values.first_name.trim(),
            last_name_kana: values.last_name_kana.trim(),
            first_name_kana: values.first_name_kana.trim(),
            gender: values.gender,
            birthday: values.birthday,
            postal_code: normalizePostalCode(values.postal_code) ?? '',
            // Q11: the single address string lives in `address` (street_address);
            // clear the decomposed parts so the next load's join doesn't duplicate.
            address: trimOrUndefined(values.address) ?? '',
            prefecture: '',
            city: '',
            building: '',
            phone: values.phone.trim(),
            email: values.email.trim(),
          },
        },
      });
    },
    () => {
      // FR-018: block the save, show the footer summary, scroll to the first
      // invalid control.
      setSubmitFailed(true);
      scrollToFirstError();
    },
  );

  const handleCancel = () => {
    // FR-025: cancel (and the back link) return to the member list, guarded by
    // the discard confirmation while dirty (FR-020).
    confirmDiscard(() => router.push(navigate('/members')));
  };

  const pageHeader = (
    <PageHeader
      breadcrumb={<BackLink label="会員管理に戻る" onClick={handleCancel} />}
      title="会員情報を編集"
    />
  );

  // Wait for the auth context before deciding access (avoids a denied flash).
  if (isAuthLoading) {
    return (
      <>
        {pageHeader}
        <DataStateBoundary isLoading isEmpty={false} onRetry={() => refetch()} />
      </>
    );
  }

  if (!canEdit) {
    return (
      <>
        <PageHeader
          breadcrumb={<BackLink label="会員管理に戻る" href={navigate('/members')} />}
          title="会員情報を編集"
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">
            会員情報の編集は本部（Headquarter / System）のみアクセスできます
          </p>
        </div>
      </>
    );
  }

  if (isLoading || isError || !member) {
    return (
      <>
        {pageHeader}
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!member}
          onRetry={() => refetch()}
          errorTitle="会員情報の取得に失敗しました"
        />
      </>
    );
  }

  // FR-033: the member detail hides the edit button for withdrawn members;
  // block direct URL access the same way.
  const isWithdrawn =
    member.memberStatus === MemberStatus.WITHDRAWN ||
    member.memberStatus === MemberStatus.FORCED_WITHDRAWAL;
  if (isWithdrawn) {
    return (
      <>
        <PageHeader
          breadcrumb={<BackLink label="会員管理に戻る" href={navigate('/members')} />}
          title="会員情報を編集"
        />
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-sm font-semibold">退会済みの会員は編集できません</p>
          <p className="text-muted-foreground text-xs">
            会員情報の変更が必要な場合は、再入会の手続きを行ってください。
          </p>
          <Link
            href={navigate('/members/[id]', id)}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            会員詳細に戻る
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {pageHeader}

      <div className="mx-auto flex max-w-240 flex-col gap-6 px-6 py-4">
        <Form {...form}>
          {/* noValidate: zod owns validation — the browser's native email/required
              bubbles must not intercept the submit (FR-016 messages instead). */}
          <form onSubmit={handleSubmit} noValidate>
            <MembersForm />

            {/* Footer: summary left (after a failed submit), actions right */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t p-4">
              {submitFailed && (
                <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
              )}
              <Button type="button" size="lg" variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
              {/* Session decision 2026-07-28 (supersedes V0's always-enabled save):
                  disabled until the form has at least one change. */}
              <Button type="submit" size="lg" disabled={!isDirty || updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存する'}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <MemberEditDiscardDialog
        open={discardDialogOpen}
        onConfirm={handleDiscardConfirm}
        onCancel={handleDiscardCancel}
      />
    </>
  );
}
