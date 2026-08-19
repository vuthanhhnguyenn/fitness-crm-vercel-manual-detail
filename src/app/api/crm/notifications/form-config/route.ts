import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { MANUAL_NOTIFICATION_FORM_CONFIG_SEED } from '@/app/api/_mock-db/seeds/manual-notification.seed';
import {
  GetManualNotificationFormConfigResponseSchema,
  ManualNotificationErrorResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, type UserRole } from '@/types/permission.type';

registerRoute({
  method: 'get',
  path: '/crm/notifications/form-config',
  summary: 'Get manual notification form configuration',
  description: 'Returns manual notification form metadata and target preview counts.',
  tags: ['Notification CRUD'],
  responses: [
    {
      status: 200,
      schema: GetManualNotificationFormConfigResponseSchema,
      description: 'Manual notification form configuration',
    },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
  ],
});

function errorResponse(status: 401 | 403, message: string) {
  return NextResponse.json(
    {
      code: status === 401 ? 'E-AUTH-001' : 'E-AUTH-006',
      message,
      userMessage: 'この操作を実行する権限がありません',
      traceId: crypto.randomUUID(),
    },
    { status },
  );
}

export async function GET(request: NextRequest) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) return errorResponse(auth.status, auth.error);

  const canCreate = hasPermissions(auth.user.role as UserRole, [
    Permission.ManualNotificationsCreate,
  ]);
  const canEdit = hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsEdit]);
  if (!canCreate && !canEdit) {
    return errorResponse(403, 'Manual notification form access capability is required');
  }
  const allowedStoreIds = getAllowedStoreIds(auth.user);
  if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
    return errorResponse(403, 'A store scope is required to access the notification form');
  }

  return NextResponse.json(MANUAL_NOTIFICATION_FORM_CONFIG_SEED);
}
