'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmFamilyRegistrationsInfiniteQueryKey,
  getCrmFamilyRegistrationsSummaryQueryKey,
  postCrmFamilyRegistrationsBulkRejectMutation,
  postCrmFamilyRegistrationsByIdRejectMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { FamilyRegistration } from '@/lib/api/types.gen';

import {
  RejectFamilyRegistrationSchema,
  type RejectFamilyRegistrationSchema as RejectFamilyRegistrationValues,
} from '../_schemas/reject-family-registration.schema';
import type { SelectType } from './approve-family-registration-modal';

export function RejectFamilyRegistrationModal({
  selectedIDs = [],
  onOpenChange,
  modalState,
  setModalState,
  registration,
  onSuccess,
}: Readonly<{
  modalState: { status: boolean; type?: SelectType };
  setModalState: Dispatch<
    SetStateAction<{
      status: boolean;
      type?: SelectType;
    }>
  >;
  selectedIDs?: string[];
  onOpenChange: (open: boolean) => void;
  registration?: FamilyRegistration;
  onSuccess: () => void;
}>) {
  const queryClient = useQueryClient();

  const form = useForm<RejectFamilyRegistrationValues>({
    resolver: zodResolver(RejectFamilyRegistrationSchema),
    mode: 'onChange',
    defaultValues: { rejection_reason: '' },
  });

  useEffect(() => {
    if (modalState?.status) {
      form.reset({ rejection_reason: '' });
    }
  }, [form, modalState?.status]);

  const rejectMutation = useMutation(postCrmFamilyRegistrationsByIdRejectMutation());
  const bulkRejectMutation = useMutation(postCrmFamilyRegistrationsBulkRejectMutation());

  const onSubmit = (data: RejectFamilyRegistrationValues) => {
    if (modalState.type === 'single') {
      if (!registration) return;
      rejectMutation.mutate(
        {
          path: { id: registration.id },
          body: { staff_id: 'staff-001', rejection_reason: data.rejection_reason },
        },
        {
          onSuccess: () => {
            toast.success('却下しました');
            setModalState({ status: false, type: modalState.type });
            queryClient.invalidateQueries({
              queryKey: getCrmFamilyRegistrationsInfiniteQueryKey(),
            });
            queryClient.invalidateQueries({ queryKey: getCrmFamilyRegistrationsSummaryQueryKey() });

            onSuccess();
          },
          onError: (err: any) => {
            toast.error(err?.error ?? err?.message ?? '却下に失敗しました');
          },
        },
      );
      return;
    }

    bulkRejectMutation.mutate(
      {
        body: { ids: selectedIDs, staff_id: 'staff-001', rejection_reason: data.rejection_reason },
      },
      {
        onSuccess: () => {
          toast.success(`${selectedIDs.length}件の却下に成功しました`);
          queryClient.invalidateQueries({ queryKey: getCrmFamilyRegistrationsInfiniteQueryKey() });
          queryClient.invalidateQueries({ queryKey: getCrmFamilyRegistrationsSummaryQueryKey() });

          onSuccess();
        },
        onError: (err: any) => {
          toast.error(err?.error ?? err?.message ?? '一括却下に失敗しました');
        },
      },
    );
  };

  return (
    <AlertDialog open={modalState.status} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>却下の確認</AlertDialogTitle>
          <AlertDialogDescription>
            {modalState.type === 'single'
              ? 'この家族入会申請を却下してもよろしいですか？'
              : 'この家族入会申請を一括却下してもよろしいですか？'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {modalState.type === 'single' && (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>
                {(registration?.applicant_name?.trim()?.[0] || 'F').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium">{registration?.applicant_name}</div>
              <div className="text-muted-foreground text-sm">
                {registration?.primary_member_name}
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rejection_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>却下理由</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                disabled={
                  rejectMutation.isPending ||
                  bulkRejectMutation.isPending ||
                  (!form.formState.isValid && form.formState.isSubmitted)
                }
                onClick={form.handleSubmit(onSubmit)}
                variant="destructive"
              >
                {rejectMutation.isPending
                  ? '却下中...'
                  : bulkRejectMutation.isPending
                    ? '一括却下中...'
                    : '却下する'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
