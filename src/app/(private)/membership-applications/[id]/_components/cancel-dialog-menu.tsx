'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  getCrmMembershipApplicationsByIdOptions,
  postCrmMembershipApplicationsByIdCancelMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { CancelDialog } from './cancel-dialog';
import { CancelErrorDialog } from './cancel-error-dialog';

const CANCEL_COUNT_TODAY = 0;

interface CancelMenuDropdownProps {
  app: any;
}

export function CancelMenuDropdown({ app }: Readonly<CancelMenuDropdownProps>) {
  const queryClient = useQueryClient();
  const applicationId = app.id;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelErrorOpen, setCancelErrorOpen] = useState(false);
  const [cancelErrorMessage, setCancelErrorMessage] = useState('');
  const [todayCancelCount, setTodayCancelCount] = useState(CANCEL_COUNT_TODAY);

  const cancelMutation = useMutation({
    ...postCrmMembershipApplicationsByIdCancelMutation(),
    onSuccess: () => {
      setTodayCancelCount((prev) => prev + 1);
      setCancelDialogOpen(false);
      setCancelReason('');
      void queryClient.invalidateQueries(
        getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
      );
      toast.success('申請を取り消しました。');
    },
    onError: () => {
      toast.error('取り消し処理に失敗しました。');
    },
  });

  function handleCancelButtonClick() {
    // 利用開始日チェック
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usageParts = (app.usage_start_date ?? app.start_date).split('/');
    const usageStart = new Date(
      Number.parseInt(usageParts[0], 10),
      Number.parseInt(usageParts[1], 10) - 1,
      Number.parseInt(usageParts[2], 10),
    );
    if (usageStart <= today) {
      setCancelErrorMessage('利用開始日を過ぎた申請はキャンセルできません。');
      setCancelErrorOpen(true);
      return;
    }
    if (todayCancelCount >= 2) {
      setCancelErrorMessage('当日のキャンセル操作は2回までです。');
      setCancelErrorOpen(true);
      return;
    }
    setCancelDialogOpen(true);
  }

  function handleCancelConfirm() {
    cancelMutation.mutate({
      path: { id: applicationId },
      body: { cancellation_reason: cancelReason },
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex size-8 items-center justify-center rounded-md border">
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={handleCancelButtonClick}>
            <div className="flex items-center gap-2">
              <X className="size-4" />
              申請を取り消す
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Cancel dialog */}
      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        paymentMethod={app.payment_method ?? 'クレジットカード'}
        cancelReason={cancelReason}
        onCancelReasonChange={setCancelReason}
        onConfirm={handleCancelConfirm}
      />

      {/* Cancel error dialog */}
      <CancelErrorDialog
        open={cancelErrorOpen}
        onOpenChange={setCancelErrorOpen}
        message={cancelErrorMessage}
      />
    </>
  );
}
