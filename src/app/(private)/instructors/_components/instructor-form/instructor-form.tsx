'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';

import {
  getCrmInstructorsByIdQueryKey,
  getCrmInstructorsQueryKey,
  postCrmInstructorsMutation,
  putCrmInstructorsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import type {
  InstructorFormInput,
  InstructorFormMode,
  InstructorFormValues,
} from '../instructor-form.schema';
import { InstructorFormSchema } from '../instructor-form.schema';
import { InstructorFormBasicInfo } from './instructor-form-basic-info';
import { InstructorFormBufferSettings } from './instructor-form-buffer-settings';
import { InstructorFormConfirmDialog } from './instructor-form-confirm-dialog';
import { InstructorFormCrmLink } from './instructor-form-crm-link';
import { InstructorFormPhoto } from './instructor-form-photo';
import { InstructorFormProfile } from './instructor-form-profile';

interface InstructorFormProps {
  mode: InstructorFormMode;
  defaultValues?: Partial<InstructorFormValues>;
  instructorId?: string;
  nameLocked?: boolean;
  roleClassificationsLocked?: boolean;
}

function formValuesToApiBody(values: Partial<InstructorFormValues>) {
  return {
    last_name: values.lastName!,
    first_name: values.firstName!,
    romaji_last_name: values.romajiLastName || null,
    romaji_first_name: values.romajiFirstName || null,
    nickname: values.nickname || null,
    role_classifications: values.roleClassifications!,
    profile_text: values.profileText || null,
    instructing_history: values.instructingHistory || null,
    photo_url: values.photoUrl || null,
    buffer_settings: {
      min_booking_lead_hours: values.minBookingLeadHours ?? 0,
      pre_buffer_minutes: values.preBufferMinutes ?? 0,
      post_buffer_minutes: values.postBufferMinutes ?? 0,
    },
    crm_account_link_staff_id: values.crmAccountLinkStaffId || null,
  };
}

export function InstructorForm({
  mode,
  defaultValues,
  instructorId,
  nameLocked = false,
  roleClassificationsLocked = false,
}: InstructorFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitValues, setSubmitValues] = useState<Partial<InstructorFormValues> | null>(null);
  const isSubmittingRef = useRef(false);
  const scrollToFirstError = useScrollToFirstError();
  const queryClient = useQueryClient();

  const form = useForm<InstructorFormInput, unknown, InstructorFormValues>({
    resolver: zodResolver(InstructorFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      lastName: '',
      firstName: '',
      romajiLastName: '',
      romajiFirstName: '',
      nickname: '',
      roleClassifications: [],
      profileText: '',
      instructingHistory: '',
      photoUrl: null,
      minBookingLeadHours: 0,
      preBufferMinutes: 0,
      postBufferMinutes: 0,
      crmAccountLinkStaffId: null,
      crmAccountLinkStaffName: null,
      ...defaultValues,
    },
  });

  const createMutation = useMutation({
    ...postCrmInstructorsMutation(),
    onSuccess: (data) => {
      toast.success('指導者を登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmInstructorsQueryKey() });
      router.push(navigate('/instructors/[id]', data.data.instructor_id));
    },
    onError: (error: Error) => {
      toast.error(error.message || '指導者の登録に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...putCrmInstructorsByIdMutation(),
    onSuccess: () => {
      toast.success('指導者の変更を保存しました');
      queryClient.invalidateQueries({ queryKey: getCrmInstructorsQueryKey() });
      if (instructorId) {
        queryClient.invalidateQueries({
          queryKey: getCrmInstructorsByIdQueryKey({
            path: { id: instructorId },
          }),
        });
      }
      router.push(navigate('/instructors/[id]', instructorId!));
    },
    onError: (error: Error) => {
      toast.error(error.message || '指導者の保存に失敗しました');
    },
  });

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const submitLabel = isEdit ? '変更を保存する' : '入力内容を確認する';
  const isPending = createMutation.isPending || updateMutation.isPending;
  const cancelHref =
    isEdit && instructorId ? navigate('/instructors/[id]', instructorId) : navigate('/instructors');

  const handleSubmit = () => {
    form.handleSubmit(
      (values) => {
        setSubmitValues(values);
        setConfirmOpen(true);
      },
      () => {},
    )();
  };

  const handleConfirm = () => {
    if (!submitValues) return;
    // Guard against rapid double-clicks firing multiple create/update requests.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setConfirmOpen(false);
    const body = formValuesToApiBody(submitValues);
    const settled = { onSettled: () => (isSubmittingRef.current = false) };
    if (isEdit && instructorId) {
      updateMutation.mutate({ body, path: { id: instructorId } }, settled);
    } else {
      createMutation.mutate({ body }, settled);
    }
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit, scrollToFirstError)}>
        <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto max-w-240">
            <Card className="mb-6">
              <CardContent className="px-6">
                <InstructorFormBasicInfo
                  nameLocked={nameLocked}
                  roleClassificationsLocked={roleClassificationsLocked}
                />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="px-6">
                <InstructorFormPhoto />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="px-6">
                <InstructorFormProfile />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="px-6">
                <InstructorFormBufferSettings />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="px-6">
                <InstructorFormCrmLink />
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <Button
                size="lg"
                variant="outline"
                type="button"
                onClick={() => router.push(cancelHref)}
              >
                キャンセル
              </Button>
              <Button size="lg" type="button" onClick={handleSubmit} disabled={isPending}>
                {submitLabel}
              </Button>
            </div>
            {hasErrors && (
              <div className="flex justify-end px-4">
                <p className="text-destructive text-xs">
                  入力内容に不備があります。エラー表示の項目をご確認ください。
                </p>
              </div>
            )}
          </div>
        </main>

        <InstructorFormConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          mode={mode}
          values={submitValues ?? {}}
          onConfirm={handleConfirm}
          isSubmitting={isPending}
        />
      </form>
    </Form>
  );
}
