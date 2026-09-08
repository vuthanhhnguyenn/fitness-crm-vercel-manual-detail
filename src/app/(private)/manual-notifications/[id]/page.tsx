'use client';

import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { Check, Pencil, RotateCcw, Trash2, Undo2 } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmNotificationsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { ManualNotificationConfirmDialog } from '../_components/manual-notification-confirm-dialog';
import { ManualNotificationReturnDialog } from '../_components/manual-notification-return-dialog';
import {
  MANUAL_NOTIFICATION_STATUS_CLASSES,
  MANUAL_NOTIFICATION_STATUS_LABELS,
  MANUAL_NOTIFICATION_TARGET_LABELS,
} from '../_constants/manual-notification.constants';
import { useManualNotificationAction } from '../_hooks/use-manual-notification-action.hook';
import type { ManualNotificationReturnReason } from '../_schemas/manual-notification-action.schema';
import {
  type ManualNotificationAction,
  getManualNotificationActionPolicy,
} from '../_utils/manual-notification-action.util';
import {
  ManualNotificationDetailContent,
  timingName,
} from './_components/manual-notification-detail-content';
import { ManualNotificationDetailSkeleton } from './_components/manual-notification-detail-skeleton';

function isNotificationNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (error as { status?: unknown }).status === 404;
}

type ManualNotificationConfirmAction = Exclude<ManualNotificationAction, 'return'>;

interface ConfirmDialogContent {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly contentClassName?: string;
  readonly descriptionClassName?: string;
  readonly confirmClassName?: string;
}

function getConfirmDialogContent(
  action: ManualNotificationConfirmAction,
  displayTitle: string,
  approvalTiming: string,
  approvalTarget: string,
): ConfirmDialogContent {
  switch (action) {
    case 'approve':
      return {
        title: 'この通知を承認しますか？',
        description: `承認後に指定タイミング（${approvalTiming}）で配信が実行されます。対象: ${approvalTarget}`,
        confirmLabel: '承認する',
        contentClassName: 'gap-4 sm:max-w-sm',
        descriptionClassName: 'leading-5',
      };
    case 'delete':
      return {
        title: '通知を削除しますか？',
        description: `「${displayTitle}」を削除します。この操作は元に戻せません。`,
        confirmLabel: '削除する',
        confirmClassName: 'bg-destructive text-destructive-foreground',
      };
    case 'request_approval':
      return {
        title: '承認依頼を送信しますか？',
        description: '通知内容を確定し、承認者に確認を依頼します。',
        confirmLabel: '依頼する',
        contentClassName: 'gap-4 sm:max-w-sm',
        descriptionClassName: 'leading-5',
      };
    case 'send':
      return {
        title: 'この通知を配信しますか？',
        description: `指定タイミング（${approvalTiming}）で配信が実行されます。対象: ${approvalTarget}`,
        confirmLabel: '配信する',
        contentClassName: 'gap-4 sm:max-w-sm',
        descriptionClassName: 'leading-5',
      };
    case 'resubmit':
      return {
        title: '再申請しますか？',
        description: '通知内容を再確定し、承認者に確認を依頼します。',
        confirmLabel: '再申請する',
        contentClassName: 'gap-4 sm:max-w-sm',
        descriptionClassName: 'leading-5',
      };
  }
}

export default function ManualNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dialog, setDialog] = useState<ManualNotificationAction | null>(null);
  const actionMutation = useManualNotificationAction();
  const query = useQuery({ ...getCrmNotificationsByIdOptions({ path: { id } }) });

  if (query.isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <PageHeader
          className="py-3"
          breadcrumb={
            <BackLink label="手動配信通知に戻る" href={navigate('/manual-notifications')} />
          }
          title="手動配信通知 詳細"
          badge={<Skeleton className="h-5 w-20" />}
        />
        <div className="flex-1 p-6">
          <DataStateBoundary
            isLoading
            isEmpty={false}
            skeleton={<ManualNotificationDetailSkeleton />}
          />
        </div>
      </div>
    );
  }
  const isNotFound = isNotificationNotFoundError(query.error);
  if (query.isError && !isNotFound) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError
        isEmpty={false}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (isNotFound || !query.data?.item) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={false}
        isEmpty
        emptyTitle="通知が見つかりません"
      />
    );
  }

  const item = query.data.item;
  const displayTitle = item.title || '無題の下書き';
  const approvalTiming =
    item.timing.type === 'scheduled'
      ? `予約: ${formatDateYYYYMMDD_HHMM(item.timing.scheduledAt, '—')}`
      : timingName(item.timing);
  const approvalTarget = `${MANUAL_NOTIFICATION_TARGET_LABELS[item.target.type]}（${item.targetCount.toLocaleString('ja-JP')}名）`;
  const { canRequestApproval, canSend, canApprove, canReturn, canResubmit, canEdit, canDelete } =
    getManualNotificationActionPolicy(item);
  const isDeliveryActive = item.status === 'sending' || item.status === 'sent';
  const runAction = (action: ManualNotificationAction, reason?: ManualNotificationReturnReason) => {
    actionMutation.mutate(
      { path: { id }, body: { action, ...(reason ? { reason } : {}) } },
      {
        onSuccess: () => {
          setDialog(null);
          if (action === 'delete') {
            router.push(navigate('/manual-notifications'));
          }
        },
      },
    );
  };
  const confirmAction: ManualNotificationConfirmAction | null =
    dialog && dialog !== 'return' ? dialog : null;
  const confirmContent = confirmAction
    ? getConfirmDialogContent(confirmAction, displayTitle, approvalTiming, approvalTarget)
    : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        className="py-3"
        breadcrumb={
          <BackLink label="手動配信通知に戻る" href={navigate('/manual-notifications')} />
        }
        title={displayTitle}
        badge={
          <>
            <Badge
              variant="outline"
              className={`text-xs ${MANUAL_NOTIFICATION_STATUS_CLASSES[item.status]}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {MANUAL_NOTIFICATION_STATUS_LABELS[item.status]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {item.id}
            </Badge>
          </>
        }
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            {canDelete && (
              <RoleGatedButton
                requiredPermission={Permission.ManualNotificationsDelete}
                variant="outline"
                size="sm"
                className="text-destructive gap-1"
                onClick={() => setDialog('delete')}
              >
                <Trash2 className="size-4" />
                削除
              </RoleGatedButton>
            )}
            {canEdit && (
              <RoleGatedButton
                requiredPermission={Permission.ManualNotificationsEdit}
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => router.push(navigate('/manual-notifications/[id]/edit', id))}
              >
                <Pencil className="size-4" />
                編集
              </RoleGatedButton>
            )}
            {canRequestApproval && (
              <RoleGatedButton
                requiredPermission={Permission.ManualNotificationsCreate}
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={actionMutation.isPending}
                onClick={() => setDialog('request_approval')}
              >
                <Check className="size-4" />
                承認依頼
              </RoleGatedButton>
            )}
            {canSend && (
              <RoleGatedButton
                requiredPermission={Permission.ManualNotificationsCreate}
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={actionMutation.isPending}
                onClick={() => setDialog('send')}
              >
                <Check className="size-4" />
                配信する
              </RoleGatedButton>
            )}
            {canResubmit && (
              <RoleGatedButton
                requiredPermission={Permission.ManualNotificationsEdit}
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={actionMutation.isPending}
                onClick={() => setDialog('resubmit')}
              >
                <RotateCcw className="size-4" />
                再申請
              </RoleGatedButton>
            )}
            {/*Decoupled canReturn and canApprove to support potential future permission splits*/}
            {canReturn && (
              <RoleGatedButton
                requiredPermission={Permission.ManualNotificationsApprove}
                variant="outline"
                size="sm"
                className="text-destructive gap-1"
                onClick={() => setDialog('return')}
              >
                <Undo2 className="size-4" />
                差し戻し
              </RoleGatedButton>
            )}
            {canApprove && (
              <RoleGatedButton
                requiredPermission={Permission.ManualNotificationsApprove}
                size="sm"
                className="gap-1"
                onClick={() => setDialog('approve')}
              >
                <Check className="size-4" />
                承認
              </RoleGatedButton>
            )}
          </div>
        }
      />

      <ManualNotificationDetailContent item={item} isDeliveryActive={isDeliveryActive} />
      {confirmAction && confirmContent ? (
        <ManualNotificationConfirmDialog
          open={dialog === confirmAction}
          onOpenChange={(open) => !open && setDialog(null)}
          title={confirmContent.title}
          description={confirmContent.description}
          confirmLabel={confirmContent.confirmLabel}
          contentClassName={confirmContent.contentClassName}
          descriptionClassName={confirmContent.descriptionClassName}
          confirmClassName={confirmContent.confirmClassName}
          onConfirm={() => runAction(confirmAction)}
          isPending={actionMutation.isPending}
        />
      ) : null}
      {dialog === 'return' ? (
        <ManualNotificationReturnDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          inputId="return-reason"
          title="通知を差し戻し"
          placeholder="例：キャンペーン期間の記載に誤りがあります。修正のうえ再度承認依頼してください。"
          helperText="差し戻し理由は通知作成者に送信されます。"
          confirmLabel="差し戻す"
          showCloseButton
          contentClassName="gap-3 sm:max-w-sm"
          headerClassName="relative place-items-start pr-8 text-left"
          labelClassName="text-sm font-medium"
          confirmClassName="bg-destructive/10 text-destructive hover:bg-destructive/20"
          isPending={actionMutation.isPending}
          onConfirm={(reason) => runAction('return', reason)}
        />
      ) : null}
    </div>
  );
}
