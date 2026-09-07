import { NextResponse } from 'next/server';

import type { ManualNotificationErrorResponse } from '@/app/api/_schemas/manual-notification.schema';

/**
 * Shared error envelope for all /crm/notifications/* routes.
 *
 * Matches the surveys convention: `{ error, detail: { message } }`. The
 * global toast reads `body.error` via `api-error.util.ts:getApiErrorMessage`.
 * The `isNotificationNotFoundError` discriminator checks `status` (attached
 * by the error interceptor on every rejection), so the 404 case is still
 * distinguishable from a generic 400/403.
 */
export function manualNotificationErrorResponse(
  status: 400 | 401 | 403 | 404,
  message: string,
): NextResponse<ManualNotificationErrorResponse> {
  const body: ManualNotificationErrorResponse = {
    error: message,
    detail: { message },
  };
  return NextResponse.json(body, { status });
}
