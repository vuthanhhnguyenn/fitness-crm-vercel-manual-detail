'use client';

import type { Dispatch, SetStateAction } from 'react';

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
  getCrmFamilyRegistrationsInfiniteQueryKey,
  getCrmFamilyRegistrationsSummaryQueryKey,
  postCrmFamilyRegistrationsBulkApproveMutation,
  postCrmFamilyRegistrationsByIdApproveMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { FamilyRegistration } from '@/lib/api/types.gen';

export type SelectType = 'single' | 'bulk';

export function ApproveFamilyRegistrationModal({
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

  const approveMutation = useMutation(postCrmFamilyRegistrationsByIdApproveMutation());
  const bulkApproveMutation = useMutation(postCrmFamilyRegistrationsBulkApproveMutation());

  const handleApprove = async () => {
    if (modalState.type === 'single') {
      if (!registration) return;
      approveMutation.mutate(
        {
          path: { id: registration.id },
          body: { staff_id: 'staff-001' },
        },
        {
          onSuccess: () => {
            toast.success('承認しました');
            setModalState({ status: false, type: modalState.type });
            queryClient.invalidateQueries({
              queryKey: getCrmFamilyRegistrationsInfiniteQueryKey(),
            });
            queryClient.invalidateQueries({ queryKey: getCrmFamilyRegistrationsSummaryQueryKey() });
            onSuccess();
          },
          onError: (err: any) => {
            toast.error(err?.error ?? err?.message ?? '承認に失敗しました');
          },
        },
      );
      return;
    }

    bulkApproveMutation.mutate(
      {
        body: { ids: selectedIDs, staff_id: 'staff-001' },
      },
      {
        onSuccess: () => {
          toast.success(`${selectedIDs.length}件の承認に成功しました`);
          queryClient.invalidateQueries({ queryKey: getCrmFamilyRegistrationsInfiniteQueryKey() });
          queryClient.invalidateQueries({ queryKey: getCrmFamilyRegistrationsSummaryQueryKey() });
          onSuccess();
        },
        onError: (err: any) => {
          toast.error(err?.error ?? err?.message ?? '一括承認に失敗しました');
        },
      },
    );
  };

  return (
    <AlertDialog open={modalState.status} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>承認の確認</AlertDialogTitle>
          <AlertDialogDescription>
            {modalState.type === 'single'
              ? 'この家族入会申請を承認してもよろしいですか？'
              : 'この家族入会申請を一括承認してもよろしいですか？'}
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

        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={approveMutation.isPending || bulkApproveMutation.isPending}
            onClick={handleApprove}
          >
            {approveMutation.isPending
              ? '承認中...'
              : bulkApproveMutation.isPending
                ? '一括承認中...'
                : '承認する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
