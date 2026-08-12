'use client';

import { useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { Check, Pencil, RotateCcw, Trash2, Undo2, X } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { getCrmNotificationsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  MANUAL_NOTIFICATION_STATUS_CLASSES,
  MANUAL_NOTIFICATION_STATUS_LABELS,
  MANUAL_NOTIFICATION_TARGET_LABELS,
  getManualNotificationActionPolicy,
} from '../_constants/manual-notification.constants';
import {
  type ManualNotificationAction,
  manualNotificationReturnReasonSchema,
  useManualNotificationAction,
} from '../_hooks/use-manual-notification-action';
import {
  ManualNotificationDetailContent,
  timingName,
} from './_components/manual-notification-detail-content';

function isNotificationNotFoundError(error: unknown): boolean {
  const candidate = error as { code?: unknown } | null;
  return (
    candidate !== null && typeof candidate === 'object' && candidate.code === 'E-NOTIFICATION-404'
  );
}

export default function ManualNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dialog, setDialog] = useState<'approve' | 'return' | 'delete' | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);
  const returnReasonRef = useRef<HTMLTextAreaElement>(null);
  const actionMutation = useManualNotificationAction();
  const query = useQuery({ ...getCrmNotificationsByIdOptions({ path: { id } }) });

  if (query.isLoading) return <DataStateBoundary isLoading isEmpty={false} />;
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
  const approvalTiming =
    item.timing.type === 'scheduled'
      ? `予約: ${formatDateYYYYMMDD_HHMM(item.timing.scheduledAt, '—')}`
      : timingName(item.timing);
  const approvalTarget = `${MANUAL_NOTIFICATION_TARGET_LABELS[item.target.type]}（${item.targetCount.toLocaleString('ja-JP')}名）`;
  const { canRequestApproval, canSend, canApprove, canReturn, canResubmit, canEdit, canDelete } =
    getManualNotificationActionPolicy(item);
  const isDeliveryActive = item.status === 'sending' || item.status === 'sent';
  const runAction = (action: ManualNotificationAction, reason?: string) => {
    actionMutation.mutate(
      { path: { id }, body: { action, ...(reason ? { reason } : {}) } },
      {
        onSuccess: () => {
          setDialog(null);
          setReturnReason('');
          setReturnError(null);
          if (action === 'delete') {
            router.push(navigate('/manual-notifications'));
            return;
          }
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        className="py-3"
        breadcrumb={
          <BackLink label="手動配信通知に戻る" href={navigate('/manual-notifications')} />
        }
        title={item.title}
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
                onClick={() => runAction('request_approval')}
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
                onClick={() => runAction('send')}
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
                onClick={() => runAction('resubmit')}
              >
                <RotateCcw className="size-4" />
                再申請
              </RoleGatedButton>
            )}
            {canApprove && canReturn && (
              <>
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
                <RoleGatedButton
                  requiredPermission={Permission.ManualNotificationsApprove}
                  size="sm"
                  className="gap-1"
                  onClick={() => setDialog('approve')}
                >
                  <Check className="size-4" />
                  承認
                </RoleGatedButton>
              </>
            )}
          </div>
        }
      />

      <ManualNotificationDetailContent item={item} isDeliveryActive={isDeliveryActive} />
      <AlertDialog open={dialog === 'approve'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent className="gap-4 sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>この通知を承認しますか？</AlertDialogTitle>
            <AlertDialogDescription className="leading-5">
              {`承認後に指定タイミング（${approvalTiming}）で配信が実行されます。対象: ${approvalTarget}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runAction('approve')}
              disabled={actionMutation.isPending}
            >
              承認する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={dialog === 'delete'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>通知を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{item.title}」を削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => runAction('delete')}
              disabled={actionMutation.isPending}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={dialog === 'return'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setReturnReason('');
            setReturnError(null);
          }
        }}
      >
        <AlertDialogContent className="gap-3 sm:max-w-sm">
          <AlertDialogHeader className="relative place-items-start pr-8 text-left">
            <AlertDialogTitle>通知を差し戻し</AlertDialogTitle>
            <button
              type="button"
              aria-label="閉じる"
              className="text-muted-foreground hover:text-foreground absolute top-0 right-0 rounded-md p-1 transition-colors"
              onClick={() => {
                setDialog(null);
                setReturnReason('');
                setReturnError(null);
              }}
            >
              <X className="size-4" />
            </button>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="return-reason" className="text-sm font-medium">
              差し戻し理由<span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="return-reason"
              value={returnReason}
              onChange={(event) => {
                setReturnReason(event.target.value);
                if (returnError) setReturnError(null);
              }}
              rows={3}
              className="min-h-16 resize-none"
              placeholder="例：キャンペーン期間の記載に誤りがあります。修正のうえ再度承認依頼してください。"
              maxLength={500}
              ref={returnReasonRef}
              aria-invalid={returnError ? true : undefined}
              aria-describedby={returnError ? 'return-reason-error' : undefined}
            />
            {returnError ? (
              <p id="return-reason-error" className="text-destructive text-xs">
                {returnError}
              </p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              差し戻し理由は通知作成者に送信されます。
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={actionMutation.isPending}
              onClick={(event) => {
                const result = manualNotificationReturnReasonSchema.safeParse(returnReason);
                if (!result.success) {
                  event.preventDefault();
                  setReturnError(
                    result.error.issues[0]?.message ?? '差し戻し理由を入力してください',
                  );
                  returnReasonRef.current?.focus();
                  return;
                }
                runAction('return', result.data);
              }}
            >
              差し戻す
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
