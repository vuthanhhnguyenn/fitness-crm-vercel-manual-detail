'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { CheckCircle2, MoreHorizontal, Pencil, RefreshCw, Send, Trash2, Undo2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  type ManualNotificationRow,
  getManualNotificationStatusLabel,
} from '../_constants/manual-notification.constants';
import { useManualNotificationAction } from '../_hooks/use-manual-notification-action.hook';
import { type ManualNotificationReturnReason } from '../_schemas/manual-notification-action.schema';
import {
  type ManualNotificationAction,
  getManualNotificationActionPolicy,
} from '../_utils/manual-notification-action.util';
import { ManualNotificationConfirmDialog } from './manual-notification-confirm-dialog';
import { ManualNotificationReturnDialog } from './manual-notification-return-dialog';

interface ManualNotificationRowActionsProps {
  readonly row: ManualNotificationRow;
}

type ManualNotificationConfirmAction = Exclude<ManualNotificationAction, 'return'>;

interface ConfirmDialogContent {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly confirmClassName?: string;
}

function getConfirmDialogContent(
  action: ManualNotificationConfirmAction,
  displayTitle: string,
): ConfirmDialogContent {
  switch (action) {
    case 'request_approval':
      return {
        title: '承認を依頼しますか？',
        description: `「${displayTitle}」をHQへ承認依頼します。`,
        confirmLabel: '依頼する',
      };
    case 'approve':
      return {
        title: '通知を承認しますか？',
        description: `「${displayTitle}」を承認します。承認後、指定タイミングで配信が実行されます。`,
        confirmLabel: '承認する',
      };
    case 'resubmit':
      return {
        title: '承認を再申請しますか？',
        description: `「${displayTitle}」を修正済みの内容で再申請します。`,
        confirmLabel: '再申請する',
      };
    case 'delete':
      return {
        title: '通知を削除しますか？',
        description: `「${displayTitle}」を削除します。この操作は元に戻せません。`,
        confirmLabel: '削除する',
        confirmClassName: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      };
    case 'send':
      return {
        title: '通知を配信しますか？',
        description: `「${displayTitle}」の配信を開始（または予約）します。`,
        confirmLabel: '配信する',
      };
  }
}

export function ManualNotificationRowActions({ row }: ManualNotificationRowActionsProps) {
  const router = useRouter();
  const displayTitle = row.title || '無題の下書き';
  const [dialog, setDialog] = useState<ManualNotificationAction | null>(null);
  const actionMutation = useManualNotificationAction();
  const { canRequestApproval, canSend, canApprove, canReturn, canResubmit, canEdit, canDelete } =
    getManualNotificationActionPolicy(row);

  const executeAction = (
    action: ManualNotificationAction,
    reason?: ManualNotificationReturnReason,
  ) => {
    actionMutation.mutate(
      { path: { id: row.id }, body: { action, ...(reason ? { reason } : {}) } },
      {
        onSuccess: () => setDialog(null),
      },
    );
  };

  const openActionDialog = (nextDialog: Exclude<ManualNotificationConfirmAction, 'delete'>) => {
    setDialog(nextDialog);
  };

  const confirmAction: ManualNotificationConfirmAction | null =
    dialog && dialog !== 'return' ? dialog : null;
  const confirmContent = confirmAction
    ? getConfirmDialogContent(confirmAction, displayTitle)
    : null;

  return (
    <div onClick={(event) => event.stopPropagation()}>
      {confirmAction && confirmContent ? (
        <ManualNotificationConfirmDialog
          open={dialog === confirmAction}
          onOpenChange={(open) => !open && setDialog(null)}
          title={confirmContent.title}
          description={confirmContent.description}
          confirmLabel={confirmContent.confirmLabel}
          confirmClassName={confirmContent.confirmClassName}
          onConfirm={() => executeAction(confirmAction)}
          isPending={actionMutation.isPending}
        />
      ) : null}

      {dialog === 'return' ? (
        <ManualNotificationReturnDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          inputId={`return-reason-${row.id}`}
          title="通知を差し戻しますか？"
          description={`「${displayTitle}」を差し戻します。差し戻し理由は通知作成者に送信されます。`}
          placeholder="例：配信対象の範囲を見直してください"
          confirmLabel="差し戻す"
          labelClassName="text-xs font-medium"
          confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          isPending={actionMutation.isPending}
          onConfirm={(reason) => executeAction('return', reason)}
        />
      ) : null}

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
              onClick={() => openActionDialog('request_approval')}
            >
              <Send className="size-4" />
              承認依頼
            </RoleGatedMenuItem>
          ) : null}

          {canSend ? (
            <RoleGatedMenuItem
              requiredPermission={Permission.ManualNotificationsCreate}
              onClick={() => openActionDialog('send')}
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
