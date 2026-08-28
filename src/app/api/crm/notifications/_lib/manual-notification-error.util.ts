import { NextResponse } from 'next/server';

import type { ManualNotificationErrorResponse } from '@/app/api/_schemas/manual-notification.schema';

/**
 * Shared error envelope for all /crm/notifications/* routes.
 *
 * Follows the repo's canonical `ErrorResponseSchema`
 * (`{ code, message, userMessage, traceId? }`). The global toast reads `userMessage`
 * via `api-error.util.ts:getApiErrorMessage`, and `code` powers the discriminator
 * helper (`isNotificationNotFoundError`).
 */
export type ManualNotificationErrorCode =
  | 'E-AUTH-001'
  | 'E-AUTH-006'
  | 'E-VAL-001'
  | 'E-NOTIFICATION-404';

export function manualNotificationErrorResponse(
  status: 400 | 401 | 403 | 404,
  message: string,
  code: ManualNotificationErrorCode = status === 401
    ? 'E-AUTH-001'
    : status === 403
      ? 'E-AUTH-006'
      : status === 404
        ? 'E-NOTIFICATION-404'
        : 'E-VAL-001',
): NextResponse<ManualNotificationErrorResponse> {
  const body: ManualNotificationErrorResponse = {
    code,
    message,
    userMessage: message,
  };
  return NextResponse.json(body, { status });
}
