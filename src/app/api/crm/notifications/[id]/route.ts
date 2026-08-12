import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  GetManualNotificationDetailResponseSchema,
  type ManualNotificationErrorResponse,
  ManualNotificationErrorResponseSchema,
  ManualNotificationUpsertBodySchema,
  ManualNotificationUpsertResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission } from '@/types/permission.type';
import type { UserRole } from '@/types/permission.type';

import {
  buildManualNotificationRow,
  isManualNotificationTargetOutOfScope,
  validateManualNotificationTiming,
} from '../_lib/manual-notification-upsert.util';

registerRoute({
  method: 'get',
  path: '/crm/notifications/{id}',
  summary: 'Get a manual notification detail',
  tags: ['Notification CRUD'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  responses: [
    {
      status: 200,
      schema: GetManualNotificationDetailResponseSchema,
      description: 'Notification detail',
    },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ManualNotificationErrorResponseSchema, description: 'Not found' },
  ],
});

function errorResponse(
  status: 400 | 401 | 403 | 404,
  userMessage: string,
  code: ManualNotificationErrorResponse['code'] = status === 401
    ? 'E-AUTH-001'
    : status === 403
      ? 'E-AUTH-006'
      : status === 404
        ? 'E-NOTIFICATION-404'
        : 'E-VAL-001',
) {
  return NextResponse.json(
    {
      code,
      message: userMessage,
      userMessage,
      traceId: crypto.randomUUID(),
    },
    { status },
  );
}

registerRoute({
  method: 'patch',
  path: '/crm/notifications/{id}',
  summary: 'Update a manual notification',
  tags: ['Notification CRUD'],
  parameters: [{ name: 'id', in: 'path', required: true }],
  requestBody: { schema: ManualNotificationUpsertBodySchema },
  responses: [
    {
      status: 200,
      schema: ManualNotificationUpsertResponseSchema,
      description: 'Notification updated',
    },
    { status: 400, schema: ManualNotificationErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ManualNotificationErrorResponseSchema, description: 'Not found' },
  ],
});

function canReadNotification(
  user: Parameters<typeof getAllowedStoreIds>[0],
  row: { createdByUserId: string; targetStoreIds: string[] },
) {
  if (!hasPermissions(user.role as UserRole, [Permission.ManualNotificationsView])) return false;
  const allowedStoreIds = getAllowedStoreIds(user);
  const canMutate = hasPermissions(user.role as UserRole, [Permission.ManualNotificationsCreate]);
  if (!canMutate || allowedStoreIds === null) return true;
  if (allowedStoreIds.length === 0) return row.createdByUserId === user.id;
  return (
    row.createdByUserId === user.id || row.targetStoreIds.some((id) => allowedStoreIds.includes(id))
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  if (!canReadNotification(auth.user, row)) {
    return NextResponse.json(
      {
        code: 'E-AUTH-006',
        message: 'Insufficient permissions',
        userMessage: 'この通知を閲覧する権限がありません',
        traceId: crypto.randomUUID(),
      },
      { status: 403 },
    );
  }

  const creator = db.users.getById(row.createdByUserId);
  const response = {
    item: {
      ...row,
      createdBy: creator?.name ?? row.createdByUserId,
    },
  };
  return NextResponse.json(GetManualNotificationDetailResponseSchema.parse(response));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    return errorResponse(auth.status, auth.error);
  }
  if (!hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsEdit])) {
    return errorResponse(403, 'この操作を実行する権限がありません');
  }

  const { id } = await params;
  const existing = db.manualNotifications.getById(id);
  if (!existing || existing.deletedAt !== null) {
    return errorResponse(404, '通知が見つかりません');
  }
  if (!['draft', 'returned', 'pending_approval'].includes(existing.status)) {
    return errorResponse(400, 'このステータスの通知は編集できません');
  }
  if (!canReadNotification(auth.user, existing)) {
    return errorResponse(403, 'この通知を編集する権限がありません');
  }

  const parsed = ManualNotificationUpsertBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return errorResponse(400, '通知内容が不正です');
  }
  const body = parsed.data;
  const allowedStoreIds = getAllowedStoreIds(auth.user);
  if (isManualNotificationTargetOutOfScope(body.target, allowedStoreIds)) {
    return errorResponse(403, '所属店舗以外の会員には配信できません');
  }
  const timingError =
    body.intent === 'submit' ? validateManualNotificationTiming(body.timing) : undefined;
  if (timingError) {
    return errorResponse(400, timingError);
  }
  const targetCount = db.manualNotifications.estimateTargetCount(body.target);
  if (body.intent === 'submit' && targetCount === 0) {
    return errorResponse(400, '配信対象の会員が存在しません');
  }

  const next = buildManualNotificationRow({
    body,
    targetCount,
    createdByUserId: auth.user.id,
    existing,
  });
  const updated = db.manualNotifications.update(id, next);
  if (!updated) {
    return errorResponse(404, '通知が見つかりません');
  }
  const creator = db.users.getById(updated.createdByUserId);
  return NextResponse.json({
    item: {
      ...updated,
      createdBy: creator?.name ?? updated.createdByUserId,
    },
  });
}
