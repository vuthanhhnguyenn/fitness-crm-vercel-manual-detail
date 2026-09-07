import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import {
  ManualNotificationErrorResponseSchema,
  ManualNotificationTargetInputSchema,
  ManualNotificationTargetPreviewResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, type UserRole } from '@/types/permission.type';

import { getManualNotificationValidationScope } from '../_lib/manual-notification-access.util';
import { manualNotificationErrorResponse } from '../_lib/manual-notification-error.util';
import { countManualNotificationTarget } from '../_lib/manual-notification-target-count.util';
import { validateManualNotificationTarget } from '../_lib/manual-notification-upsert.util';

registerRoute({
  method: 'post',
  path: '/crm/notifications/target-preview',
  summary: 'Preview manual notification recipient count',
  description: 'Calculates a caller-scoped recipient count without creating a notification.',
  tags: ['Notification CRUD'],
  requestBody: { schema: ManualNotificationTargetInputSchema },
  responses: [
    {
      status: 200,
      schema: ManualNotificationTargetPreviewResponseSchema,
      description: 'Recipient count preview',
    },
    { status: 400, schema: ManualNotificationErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
  ],
});

export async function POST(request: NextRequest) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    return manualNotificationErrorResponse(auth.status, 'この操作を実行する権限がありません');
  }

  const canCreate = hasPermissions(auth.user.role as UserRole, [
    Permission.ManualNotificationsCreate,
  ]);
  const canEdit = hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsEdit]);
  if (!canCreate && !canEdit) {
    return manualNotificationErrorResponse(403, 'この操作を実行する権限がありません');
  }

  const parsed = ManualNotificationTargetInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return manualNotificationErrorResponse(400, '配信対象が不正です');
  }

  const allowedStoreIds = getManualNotificationValidationScope(auth.user);
  const validationError = validateManualNotificationTarget(parsed.data, allowedStoreIds);
  if (validationError === 'not_found') {
    return manualNotificationErrorResponse(400, '配信対象が存在しません');
  }
  if (validationError === 'out_of_scope') {
    return manualNotificationErrorResponse(403, '所属店舗以外の会員には配信できません');
  }

  return NextResponse.json(
    ManualNotificationTargetPreviewResponseSchema.parse({
      targetCount: countManualNotificationTarget(parsed.data, allowedStoreIds),
    }),
  );
}
