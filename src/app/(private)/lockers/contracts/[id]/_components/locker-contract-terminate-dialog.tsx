'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfDay } from 'date-fns';
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
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';

import {
  getCrmLockersContractsByIdQueryKey,
  getCrmLockersContractsQueryKey,
  patchCrmLockersContractsByIdCancelMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersContractsByIdResponse } from '@/lib/api/types.gen';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];

interface LockerContractTerminateDialogProps {
  contractId: string;
  contract: LockerContractDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LockerContractTerminateDialog({
  contractId,
  contract,
  open,
  onOpenChange,
  onSuccess,
}: LockerContractTerminateDialogProps) {
  const queryClient = useQueryClient();
  const [terminationDate, setTerminationDate] = useState<Date | undefined>();
  const cancelContractMutation = useMutation({
    ...patchCrmLockersContractsByIdCancelMutation(),
    onSuccess: () => {
      toast.success('ロッカー契約を解約しました');
      queryClient.invalidateQueries({
        queryKey: getCrmLockersContractsByIdQueryKey({ path: { id: contractId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmLockersContractsQueryKey(),
        refetchType: 'all',
      });
      onSuccess?.();
    },
    onError: () => {
      toast.error('ロッカー契約の解約に失敗しました');
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setTerminationDate(undefined);
  };

  const handleConfirm = () => {
    if (!terminationDate) return;
    const terminationDateTime = new Date(
      Date.UTC(
        terminationDate.getFullYear(),
        terminationDate.getMonth(),
        terminationDate.getDate(),
      ),
    ).toISOString();

    cancelContractMutation.mutate(
      {
        path: { id: contractId },
        body: { termination_date: terminationDateTime },
      },
      {
        onSuccess: () => {
          setTerminationDate(undefined);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ロッカー契約を解約しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {contract.member_name} さんのロッカー契約（{contract.locker_number}
            ）を解約します。解約日を指定してください。解約日経過後、スロットは自動的に「開放待ち」状態へ遷移します。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label className="text-sm">
            解約日
            <span className="text-destructive ml-1">*</span>
          </Label>
          <DatePicker
            date={terminationDate}
            placeholder="日付を選択"
            onDateChange={setTerminationDate}
            disabledDate={(date) => date < startOfDay(new Date())}
          />
          <p className="text-muted-foreground text-xs">
            解約日まではスロット状態「使用中」を維持します。解約日経過後にシステムバッチで「開放待ち」へ自動遷移します。
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setTerminationDate(undefined)}
            disabled={cancelContractMutation.isPending}
          >
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={!terminationDate || cancelContractMutation.isPending}
          >
            {cancelContractMutation.isPending ? '処理中...' : '解約を確定する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
