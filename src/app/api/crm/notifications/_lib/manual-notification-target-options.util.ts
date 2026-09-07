import type { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, type UserRole } from '@/types/permission.type';

import { getManualNotificationValidationScope } from './manual-notification-access.util';
import { manualNotificationErrorResponse } from './manual-notification-error.util';

type ManualNotificationTargetOptionsAuthResult =
  | { ok: true; allowedStoreIds: string[] | null }
  | { ok: false; response: NextResponse };

export function authorizeManualNotificationTargetOptions(
  request: NextRequest,
): ManualNotificationTargetOptionsAuthResult {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    return {
      ok: false,
      response: manualNotificationErrorResponse(auth.status, 'この操作を実行する権限がありません'),
    };
  }

  const canUseForm =
    hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsCreate]) ||
    hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsEdit]);
  if (!canUseForm) {
    return {
      ok: false,
      response: manualNotificationErrorResponse(403, 'この操作を実行する権限がありません'),
    };
  }

  const allowedStoreIds = getManualNotificationValidationScope(auth.user);
  if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
    return {
      ok: false,
      response: manualNotificationErrorResponse(403, 'この操作を実行する権限がありません'),
    };
  }

  return { ok: true, allowedStoreIds };
}

export function normalizeManualNotificationTargetSearch(value: string): string {
  return value.normalize('NFKC').toLowerCase().trim();
}
