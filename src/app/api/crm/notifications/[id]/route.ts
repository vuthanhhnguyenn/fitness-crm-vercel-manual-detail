import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  GetManualNotificationDetailResponseSchema,
  ManualNotificationErrorResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission } from '@/types/permission.type';
import type { UserRole } from '@/types/permission.type';

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

function canReadNotification(
  user: Parameters<typeof getAllowedStoreIds>[0],
  row: { createdByUserId: string; targetStoreIds: string[] },
) {
  if (!hasPermissions(user.role as UserRole, [Permission.ManualNotificationsView])) return false;
  if (user.role !== 'Staff') return true;
  const allowedStoreIds = getAllowedStoreIds(user) ?? [];
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
