'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAfter, startOfDay } from 'date-fns';
import { MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  getCrmMembershipApplicationsByIdOptions,
  getCrmMembershipApplicationsOptions,
  postCrmMembershipApplicationsByIdCancelMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { Permission, UserRole } from '@/types/permission.type';

import { CancelDialog } from './cancel-dialog';
import { CancelErrorDialog } from './cancel-error-dialog';
import type { ApplicationDetail } from './membership-application.utils';

interface CancelMenuDropdownProps {
  app: ApplicationDetail;
}

function cancelErrorMessageFor(error: unknown): string {
  if (!(error instanceof Error)) return '取り消し処理に失敗しました。';
  if (error.message.includes('利用開始日')) return '利用開始日を過ぎた申請はキャンセルできません。';
  if (error.message.includes('回')) return '当日のキャンセル操作は2回までです。';
  return '取り消し処理に失敗しました。';
}

export function CancelMenuDropdown({ app }: Readonly<CancelMenuDropdownProps>) {
  const queryClient = useQueryClient();
  const applicationId = app.id;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelErrorOpen, setCancelErrorOpen] = useState(false);
  const [cancelErrorMessage, setCancelErrorMessage] = useState('');

  const cancelMutation = useMutation({
    ...postCrmMembershipApplicationsByIdCancelMutation(),
    onSuccess: () => {
      setCancelDialogOpen(false);
      setCancelReason('');
      void queryClient.invalidateQueries(
        getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
      );
      void queryClient.invalidateQueries({
        queryKey: getCrmMembershipApplicationsOptions().queryKey,
      });
      toast.success('申請を取り消しました。');
    },
    onError: (error) => {
      toast.error(cancelErrorMessageFor(error));
    },
  });

  function handleCancelButtonClick() {
    const usageStart = new Date(`${app.usage_start_date}T00:00:00`);
    const today = startOfDay(new Date());
    if (!isAfter(usageStart, today)) {
      setCancelErrorMessage('利用開始日を過ぎた申請はキャンセルできません。');
      setCancelErrorOpen(true);
      return;
    }
    if (app.same_day_cancel_count >= 2) {
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
          <RoleGatedMenuItem
            variant="destructive"
            allowedRoles={[UserRole.Headquarter, UserRole.Manager, UserRole.Staff]}
            requiredPermission={Permission.MembershipApplicationsCancel}
            denyBadge="権限なし"
            onClick={handleCancelButtonClick}
          >
            <div className="flex items-center gap-2">
              <X className="size-4" />
              申請を取り消す
            </div>
          </RoleGatedMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        paymentMethod={app.payment_method}
        sameDayCancelCount={app.same_day_cancel_count}
        cancelReason={cancelReason}
        onCancelReasonChange={setCancelReason}
        onConfirm={handleCancelConfirm}
      />

      <CancelErrorDialog
        open={cancelErrorOpen}
        onOpenChange={setCancelErrorOpen}
        message={cancelErrorMessage}
      />
    </>
  );
}
