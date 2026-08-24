import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import {
  BRAND_MULTIPLIERS,
  CONTRACT_TYPE_MULTIPLIERS,
  MANUAL_NOTIFICATION_FORM_CONFIG_SEED,
} from '@/app/api/_mock-db/seeds/manual-notification.seed';
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

  const searchParams = request.nextUrl.searchParams;
  const brandParam = searchParams.get('brand');
  const contractTypeParam = searchParams.get('contractType');
  const months = Number(searchParams.get('months')) || 3;
  const condition = searchParams.get('condition') || 'within';

  const base = MANUAL_NOTIFICATION_FORM_CONFIG_SEED.targetPreviewCounts;

  const targetPreviewCounts = {
    ...base,
    brands: Math.round(base.brands * (BRAND_MULTIPLIERS[brandParam ?? ''] ?? 1)),
    contractType: Math.round(
      base.contractType * (CONTRACT_TYPE_MULTIPLIERS[contractTypeParam ?? ''] ?? 1),
    ),
    membershipDuration: Math.round(
      base.membershipDuration *
        (condition === 'within' ? Math.min(months / 12, 1) : Math.max(1 - months / 60, 0.1)),
    ),
  };

  return NextResponse.json({
    templates: MANUAL_NOTIFICATION_FORM_CONFIG_SEED.templates,
    targetPreviewCounts,
  });
}
