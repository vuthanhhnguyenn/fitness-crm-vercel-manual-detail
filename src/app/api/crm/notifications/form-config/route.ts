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

import { manualNotificationErrorResponse } from '../_lib/manual-notification-error.util';
import { getManualNotificationFormPreviewCounts } from '../_lib/manual-notification-target-count.util';

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

function errorResponse(status: 401 | 403, userMessage: string) {
  return manualNotificationErrorResponse(status, userMessage);
}

export async function GET(request: NextRequest) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) return errorResponse(auth.status, 'この操作を実行する権限がありません');

  const canCreate = hasPermissions(auth.user.role as UserRole, [
    Permission.ManualNotificationsCreate,
  ]);
  const canEdit = hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsEdit]);
  if (!canCreate && !canEdit) {
    return errorResponse(403, 'この操作を実行する権限がありません');
  }
  const allowedStoreIds = getAllowedStoreIds(auth.user);
  if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
    return errorResponse(403, 'この操作を実行する権限がありません');
  }

  return NextResponse.json(
    GetManualNotificationFormConfigResponseSchema.parse({
      templates: MANUAL_NOTIFICATION_FORM_CONFIG_SEED.templates,
      targetPreviewCounts: getManualNotificationFormPreviewCounts(),
    }),
  );
}
