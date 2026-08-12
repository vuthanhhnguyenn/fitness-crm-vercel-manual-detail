import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ManualNotificationActionResponseSchema,
  ManualNotificationActionSchema,
  ManualNotificationErrorResponseSchema,
  ManualNotificationListItemSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission } from '@/types/permission.type';
import type { UserRole } from '@/types/permission.type';

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
    return NextResponse.json(
      {
        code: auth.status === 401 ? 'E-AUTH-001' : 'E-AUTH-006',
        message: auth.error,
        userMessage: 'Authentication or authorization failed',
        traceId: crypto.randomUUID(),
      },
      { status: auth.status },
    );
  }
  const { id } = await params;
  const row = db.manualNotifications.getById(id);
  if (!row || row.deletedAt !== null) {
    return NextResponse.json(
      {
        code: 'E-NOTIFICATION-404',
        message: 'Notification not found',
        userMessage: '通知が見つかりません',
        traceId: crypto.randomUUID(),
      },
      { status: 404 },
    );
  }
  const allowedStoreIds = getAllowedStoreIds(auth.user);
  const canMutate = hasPermissions(auth.user.role as UserRole, [
    Permission.ManualNotificationsCreate,
  ]);
  if (
    canMutate &&
    allowedStoreIds !== null &&
    (allowedStoreIds.length === 0 ||
      (row.createdByUserId !== auth.user.id &&
        !row.targetStoreIds.some((storeId) => allowedStoreIds.includes(storeId))))
  ) {
    return NextResponse.json(
      {
        code: 'E-AUTH-006',
        message: 'Insufficient permissions',
        userMessage: 'この通知を操作する権限がありません',
        traceId: crypto.randomUUID(),
      },
      { status: 403 },
    );
  }

  const parsed = ManualNotificationActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: 'E-VAL-001',
        message: 'Invalid action',
        userMessage: '不正な操作です',
        traceId: crypto.randomUUID(),
      },
      { status: 400 },
    );
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
    return NextResponse.json(
      {
        code: 'E-AUTH-006',
        message: 'Insufficient permissions',
        userMessage: 'この操作を実行する権限がありません',
        traceId: crypto.randomUUID(),
      },
      { status: 403 },
    );
  }
  if (action === 'return' && !reason) {
    return NextResponse.json(
      {
        code: 'E-VAL-001',
        message: 'Return reason is required',
        userMessage: '差し戻し理由を入力してください',
        traceId: crypto.randomUUID(),
      },
      { status: 400 },
    );
  }
  if (action === 'approve' || action === 'return') {
    if (row.status !== 'pending_approval') {
      return NextResponse.json(
        {
          code: 'E-VAL-001',
          message: 'Invalid notification status',
          userMessage: '現在のステータスでは操作できません',
          traceId: crypto.randomUUID(),
        },
        { status: 400 },
      );
    }
  }

  if (action === 'request_approval' && (!row.requiresApproval || row.status !== 'draft')) {
    return NextResponse.json(
      {
        code: 'E-VAL-001',
        message: 'Approval is not required or status is invalid',
        userMessage: '承認が必要でないか、ステータスが不正です',
        traceId: crypto.randomUUID(),
      },
      { status: 400 },
    );
  }
  if (action === 'send' && (row.requiresApproval || row.status !== 'draft')) {
    return NextResponse.json(
      {
        code: 'E-VAL-001',
        message: 'Notification requires approval or status is invalid',
        userMessage: '承認が必要か、ステータスが不正です',
        traceId: crypto.randomUUID(),
      },
      { status: 400 },
    );
  }

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
      return NextResponse.json(
        {
          code: 'E-VAL-001',
          message: 'Notification cannot be deleted',
          userMessage: 'この通知は削除できません',
          traceId: crypto.randomUUID(),
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ item: ManualNotificationListItemSchema.parse(row) });
  }
  if (!nextStatus) {
    return NextResponse.json(
      {
        code: 'E-VAL-001',
        message: 'Invalid action',
        userMessage: '不正な操作です',
        traceId: crypto.randomUUID(),
      },
      { status: 400 },
    );
  }
  if (action === 'request_approval' && row.status !== 'draft') {
    return NextResponse.json(
      {
        code: 'E-VAL-001',
        message: 'Invalid notification status',
        userMessage: '現在のステータスでは操作できません',
        traceId: crypto.randomUUID(),
      },
      { status: 400 },
    );
  }
  if (action === 'resubmit' && row.status !== 'returned') {
    return NextResponse.json(
      {
        code: 'E-VAL-001',
        message: 'Invalid notification status',
        userMessage: '現在のステータスでは操作できません',
        traceId: crypto.randomUUID(),
      },
      { status: 400 },
    );
  }
  const updated = db.manualNotifications.updateStatus(id, nextStatus);
  if (!updated) {
    return NextResponse.json(
      {
        code: 'E-NOTIFICATION-404',
        message: 'Notification not found',
        userMessage: '通知が見つかりません',
        traceId: crypto.randomUUID(),
      },
      { status: 404 },
    );
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
  return NextResponse.json({ item: ManualNotificationListItemSchema.parse(updated) });
}
