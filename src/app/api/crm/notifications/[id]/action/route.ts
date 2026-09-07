import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ManualNotificationActionResponseSchema,
  ManualNotificationActionSchema,
  ManualNotificationErrorResponseSchema,
  ManualNotificationListItemSchema,
  ManualNotificationUpsertBodySchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission } from '@/types/permission.type';
import type { UserRole } from '@/types/permission.type';

import {
  canReadManualNotification,
  canWriteManualNotification,
} from '../../_lib/manual-notification-access.util';
import { manualNotificationErrorResponse } from '../../_lib/manual-notification-error.util';
import { countManualNotificationTarget } from '../../_lib/manual-notification-target-count.util';
import {
  getManualNotificationTargetStoreIds,
  manualNotificationTargetToInput,
  validateManualNotificationTarget,
  validateManualNotificationTiming,
} from '../../_lib/manual-notification-upsert.util';

registerRoute({
  method: 'patch',
  path: '/crm/notifications/{id}/action',
  summary: 'Execute a manual notification list action',
  tags: ['Notification CRUD'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: ManualNotificationActionSchema },
  responses: [
    { status: 200, schema: ManualNotificationActionResponseSchema, description: 'Action applied' },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 400, schema: ManualNotificationErrorResponseSchema, description: 'Invalid action' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ManualNotificationErrorResponseSchema, description: 'Not found' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    return manualNotificationErrorResponse(auth.status, 'この操作を実行する権限がありません');
  }
  const { id } = await params;
  const row = db.manualNotifications.getById(id);
  if (!row || row.deletedAt !== null) {
    return manualNotificationErrorResponse(404, '通知が見つかりません');
  }
  if (!canReadManualNotification(auth.user, row)) {
    return manualNotificationErrorResponse(403, 'この通知を操作する権限がありません');
  }

  const parsed = ManualNotificationActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return manualNotificationErrorResponse(400, '不正な操作です');
  }
  const { action, reason } = parsed.data;
  const requiredPermission =
    action === 'approve' || action === 'return'
      ? Permission.ManualNotificationsApprove
      : action === 'delete'
        ? Permission.ManualNotificationsDelete
        : action === 'resubmit'
          ? Permission.ManualNotificationsEdit
          : Permission.ManualNotificationsCreate;
  if (!hasPermissions(auth.user.role as UserRole, [requiredPermission])) {
    return manualNotificationErrorResponse(403, 'この操作を実行する権限がありません');
  }
  const writeActions = ['request_approval', 'send', 'resubmit', 'delete'];
  if (writeActions.includes(action)) {
    if (!canWriteManualNotification(auth.user, row)) {
      return manualNotificationErrorResponse(403, 'この通知を操作する権限がありません');
    }
  }
  if (action === 'return' && !reason) {
    return manualNotificationErrorResponse(400, '差し戻し理由を入力してください');
  }
  if (action === 'approve' || action === 'return') {
    if (!row.requiresApproval || row.status !== 'pending_approval') {
      return manualNotificationErrorResponse(400, '現在のステータスでは操作できません');
    }
  }

  if (action === 'request_approval' && (!row.requiresApproval || row.status !== 'draft')) {
    return manualNotificationErrorResponse(400, '承認が必要でないか、ステータスが不正です');
  }
  if (action === 'send' && (row.requiresApproval || row.status !== 'draft')) {
    return manualNotificationErrorResponse(400, '承認が必要か、ステータスが不正です');
  }

  if (action === 'resubmit' && (!row.requiresApproval || row.status !== 'returned')) {
    return manualNotificationErrorResponse(400, '承認が必要でないか、ステータスが不正です');
  }

  let targetMetadata: { targetCount: number; targetStoreIds: string[] } | undefined;
  if (['request_approval', 'send', 'approve', 'resubmit'].includes(action)) {
    const target = manualNotificationTargetToInput(row.target);
    const parsedSubmission = ManualNotificationUpsertBodySchema.safeParse({
      title: row.title,
      target,
      channels: row.channels,
      contents: row.contents,
      timing: row.timing,
      intent: 'submit',
    });
    if (!parsedSubmission.success) {
      return manualNotificationErrorResponse(400, '通知内容に未入力または不正な項目があります');
    }

    const allowedStoreIds = row.recipientScopeStoreIds;
    const targetValidationError = validateManualNotificationTarget(target, allowedStoreIds);
    if (targetValidationError) {
      return manualNotificationErrorResponse(
        targetValidationError === 'out_of_scope' ? 403 : 400,
        targetValidationError === 'out_of_scope'
          ? '所属店舗以外の会員には配信できません'
          : '配信対象が存在しません',
      );
    }

    const timingError = validateManualNotificationTiming(parsedSubmission.data.timing);
    if (timingError) {
      return manualNotificationErrorResponse(400, timingError);
    }

    const targetCount = countManualNotificationTarget(target, allowedStoreIds);
    if (targetCount === 0) {
      return manualNotificationErrorResponse(400, '配信対象の会員が存在しません');
    }
    targetMetadata = {
      targetCount,
      targetStoreIds: getManualNotificationTargetStoreIds(target, allowedStoreIds),
    };
  }

  // TODO(#28): `sending` never advances to `sent` here because delivery
  // execution and result write-back are deferred from the Phase 1 mock.
  const nextStatus =
    action === 'request_approval'
      ? 'pending_approval'
      : action === 'send'
        ? row.timing.type === 'immediate'
          ? 'sending'
          : 'scheduled'
        : action === 'approve'
          ? row.timing.type === 'immediate'
            ? 'sending'
            : 'scheduled'
          : action === 'return'
            ? 'returned'
            : action === 'resubmit'
              ? 'pending_approval'
              : null;
  if (action === 'delete') {
    if (!['draft', 'returned'].includes(row.status) || !db.manualNotifications.softDelete(id)) {
      return manualNotificationErrorResponse(400, 'この通知は削除できません');
    }
    return NextResponse.json({ item: ManualNotificationListItemSchema.parse(row) });
  }
  if (!nextStatus) {
    return manualNotificationErrorResponse(400, '不正な操作です');
  }
  const updated = db.manualNotifications.updateStatus(id, nextStatus, targetMetadata);
  if (!updated) {
    return manualNotificationErrorResponse(404, '通知が見つかりません');
  }
  if (action === 'approve') {
    db.manualNotifications.updateAudit(id, {
      approvedBy: auth.user.name,
      approvedAt: new Date().toISOString(),
    });
  }
  if (action === 'return') {
    db.manualNotifications.updateAudit(id, { returnReason: reason });
  }
  if (action === 'resubmit') {
    db.manualNotifications.updateAudit(id, { returnReason: undefined });
  }
  return NextResponse.json(ManualNotificationActionResponseSchema.parse({ item: updated }));
}
