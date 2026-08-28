import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  GetManualNotificationDetailResponseSchema,
  ManualNotificationErrorResponseSchema,
  ManualNotificationUpsertBodySchema,
  ManualNotificationUpsertResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission } from '@/types/permission.type';
import type { UserRole } from '@/types/permission.type';

import {
  canReadManualNotification,
  canWriteManualNotification,
} from '../_lib/manual-notification-access.util';
import { manualNotificationErrorResponse } from '../_lib/manual-notification-error.util';
import {
  buildManualNotificationRow,
  manualNotificationRequiresApproval,
  validateManualNotificationTarget,
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    return manualNotificationErrorResponse(auth.status, 'この操作を実行する権限がありません');
  }

  const { id } = await params;
  const row = db.manualNotifications.getById(id);
  if (!row || row.deletedAt !== null) {
    return manualNotificationErrorResponse(404, '通知が見つかりません', 'E-NOTIFICATION-404');
  }
  if (!canReadManualNotification(auth.user, row)) {
    return manualNotificationErrorResponse(403, 'この通知を閲覧する権限がありません');
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
    return manualNotificationErrorResponse(auth.status, 'この操作を実行する権限がありません');
  }
  if (!hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsEdit])) {
    return manualNotificationErrorResponse(403, 'この操作を実行する権限がありません');
  }

  const { id } = await params;
  const existing = db.manualNotifications.getById(id);
  if (!existing || existing.deletedAt !== null) {
    return manualNotificationErrorResponse(404, '通知が見つかりません', 'E-NOTIFICATION-404');
  }
  const creator = db.users.getById(existing.createdByUserId);
  if (!canWriteManualNotification(auth.user, existing)) {
    return manualNotificationErrorResponse(403, 'この通知を編集する権限がありません');
  }
  if (!['draft', 'returned', 'pending_approval'].includes(existing.status)) {
    return manualNotificationErrorResponse(400, 'このステータスの通知は編集できません');
  }
  const parsed = ManualNotificationUpsertBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (parsed.success && existing.status === 'pending_approval' && parsed.data.intent === 'save') {
    return manualNotificationErrorResponse(400, '承認待ちの通知は下書き保存できません');
  }
  if (parsed.success && existing.status === 'pending_approval' && parsed.data.intent === 'submit') {
    const newRequiresApproval = manualNotificationRequiresApproval(parsed.data.target);
    if (!newRequiresApproval) {
      return manualNotificationErrorResponse(
        400,
        '承認待ちの通知の配信対象（承認不要な対象へ）は変更できません',
      );
    }
  }
  if (!parsed.success) {
    return manualNotificationErrorResponse(400, '通知内容が不正です');
  }
  const body = parsed.data;
  const allowedStoreIds = getAllowedStoreIds(auth.user);
  const targetValidationError = validateManualNotificationTarget(body.target, allowedStoreIds);
  if (targetValidationError === 'not_found') {
    return manualNotificationErrorResponse(400, '配信対象が存在しません');
  }
  if (targetValidationError === 'out_of_scope') {
    return manualNotificationErrorResponse(403, '所属店舗以外の会員には配信できません');
  }
  const timingError =
    body.intent === 'submit' ? validateManualNotificationTiming(body.timing) : undefined;
  if (timingError) {
    return manualNotificationErrorResponse(400, timingError);
  }
  const targetCount = db.manualNotifications.estimateTargetCount(body.target);
  if (body.intent === 'submit' && targetCount === 0) {
    return manualNotificationErrorResponse(400, '配信対象の会員が存在しません');
  }

  const next = buildManualNotificationRow({
    body,
    targetCount,
    createdByUserId: auth.user.id,
    existing,
  });
  const updated = db.manualNotifications.update(id, next);
  if (!updated) {
    return manualNotificationErrorResponse(404, '通知が見つかりません', 'E-NOTIFICATION-404');
  }
  return NextResponse.json(
    ManualNotificationUpsertResponseSchema.parse({
      item: {
        ...updated,
        createdBy: creator?.name ?? updated.createdByUserId,
      },
    }),
  );
}
