'use client';

import { type MouseEvent, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CheckCircle2, MoreHorizontal, Pencil, RefreshCw, Send, Trash2, Undo2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  type ManualNotificationRow,
  getManualNotificationActionPolicy,
  getManualNotificationStatusLabel,
} from '../_constants/manual-notification.constants';
import {
  type ManualNotificationAction,
  manualNotificationReturnReasonSchema,
  useManualNotificationAction,
} from '../_hooks/use-manual-notification-action';

interface ManualNotificationRowActionsProps {
  readonly row: ManualNotificationRow;
}

export function ManualNotificationRowActions({ row }: ManualNotificationRowActionsProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<
    'request-approval' | 'approve' | 'return' | 'resubmit' | 'delete' | null
  >(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);
  const actionMutation = useManualNotificationAction();
  const { canRequestApproval, canSend, canApprove, canReturn, canResubmit, canEdit, canDelete } =
    getManualNotificationActionPolicy(row);

  const closeReturnDialog = () => {
    setDialog(null);
    setReturnReason('');
    setReturnError(null);
  };

  const executeAction = (action: Exclude<ManualNotificationAction, 'return'>, reason?: string) => {
    actionMutation.mutate(
      { path: { id: row.id }, body: { action, ...(reason ? { reason } : {}) } },
      {
        onSuccess: () => setDialog(null),
      },
    );
  };

  const handleReturn = (event: MouseEvent<HTMLButtonElement>) => {
    const result = manualNotificationReturnReasonSchema.safeParse(returnReason);
    if (!result.success) {
      event.preventDefault();
      setReturnError(result.error.issues[0]?.message ?? '差し戻し理由を入力してください');
      return;
    }
    actionMutation.mutate(
      { path: { id: row.id }, body: { action: 'return', reason: result.data } },
      {
        onSuccess: closeReturnDialog,
      },
    );
  };

  const openActionDialog = (nextDialog: Exclude<typeof dialog, 'return' | 'delete' | null>) => {
    setDialog(nextDialog);
  };

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <AlertDialog
        open={dialog === 'request-approval'}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>承認を依頼しますか？</AlertDialogTitle>
            <AlertDialogDescription>「{row.title}」をHQへ承認依頼します。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction('request_approval')}
              disabled={actionMutation.isPending}
            >
              依頼する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'approve'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>通知を承認しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{row.title}」を承認します。承認後、指定タイミングで配信が実行されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction('approve')}
              disabled={actionMutation.isPending}
            >
              承認する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'resubmit'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>承認を再申請しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{row.title}」を修正済みの内容で再申請します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction('resubmit')}
              disabled={actionMutation.isPending}
            >
              再申請する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'return'} onOpenChange={(open) => !open && closeReturnDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>通知を差し戻しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{row.title}」を差し戻します。差し戻し理由は通知作成者に送信されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor={`return-reason-${row.id}`} className="text-xs font-medium">
              差し戻し理由
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
            </label>
            <Textarea
              id={`return-reason-${row.id}`}
              value={returnReason}
              onChange={(event) => {
                setReturnReason(event.target.value);
                if (returnError) setReturnError(null);
              }}
              placeholder="例：配信対象の範囲を見直してください"
              rows={3}
              className="min-h-16 resize-none"
              aria-invalid={returnError ? true : undefined}
              aria-describedby={returnError ? `return-reason-error-${row.id}` : undefined}
            />
            {returnError ? (
              <p id={`return-reason-error-${row.id}`} className="text-destructive text-xs">
                {returnError}
              </p>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeReturnDialog}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReturn}
              disabled={actionMutation.isPending}
            >
              差し戻す
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'delete'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>通知を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{row.title}」を削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => executeAction('delete')}
              disabled={actionMutation.isPending}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="通知の操作"
          className="hover:bg-muted flex size-7 items-center justify-center rounded-md"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {canRequestApproval ? (
            <RoleGatedMenuItem
              requiredPermission={Permission.ManualNotificationsCreate}
              onClick={() => openActionDialog('request-approval')}
            >
              <Send className="size-4" />
              承認依頼
            </RoleGatedMenuItem>
          ) : null}

          {canSend ? (
            <RoleGatedMenuItem
              requiredPermission={Permission.ManualNotificationsCreate}
              onClick={() => executeAction('send')}
            >
              <Send className="size-4" />
              配信する
            </RoleGatedMenuItem>
          ) : null}

          {canApprove || canReturn ? (
            <>
              <RoleGatedMenuItem
                requiredPermission={Permission.ManualNotificationsApprove}
                onClick={() => openActionDialog('approve')}
              >
                <CheckCircle2 className="size-4" />
                承認
              </RoleGatedMenuItem>
              <RoleGatedMenuItem
                requiredPermission={Permission.ManualNotificationsApprove}
                onClick={() => setDialog('return')}
              >
                <Undo2 className="size-4" />
                差し戻し
              </RoleGatedMenuItem>
            </>
          ) : null}

          {canResubmit ? (
            <RoleGatedMenuItem
              requiredPermission={Permission.ManualNotificationsEdit}
              onClick={() => openActionDialog('resubmit')}
            >
              <RefreshCw className="size-4" />
              再申請
            </RoleGatedMenuItem>
          ) : null}

          {canRequestApproval || row.status === 'pending_approval' || row.status === 'returned' ? (
            <DropdownMenuSeparator />
          ) : null}

          <RoleGatedMenuItem
            requiredPermission={Permission.ManualNotificationsEdit}
            disabled={!canEdit}
            tooltip={
              !canEdit
                ? `${getManualNotificationStatusLabel(row.status)}は編集できません`
                : undefined
            }
            onClick={() =>
              canEdit && router.push(navigate('/manual-notifications/[id]/edit', row.id))
            }
          >
            <Pencil className="size-4" />
            編集
          </RoleGatedMenuItem>
          <DropdownMenuSeparator />
          <RoleGatedMenuItem
            requiredPermission={Permission.ManualNotificationsDelete}
            disabled={!canDelete}
            className="text-destructive"
            tooltip={
              !canDelete
                ? `${getManualNotificationStatusLabel(row.status)}は削除できません`
                : undefined
            }
            onClick={() => setDialog('delete')}
          >
            <Trash2 className="size-4" />
            削除
          </RoleGatedMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
