import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetManualNotificationTargetStoresQuery,
  GetManualNotificationTargetStoresQuerySchema,
  type GetManualNotificationTargetStoresResponse,
  GetManualNotificationTargetStoresResponseSchema,
  ManualNotificationErrorResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { manualNotificationErrorResponse } from '../../_lib/manual-notification-error.util';
import {
  authorizeManualNotificationTargetOptions,
  normalizeManualNotificationTargetSearch,
} from '../../_lib/manual-notification-target-options.util';

registerRoute({
  method: 'get',
  path: '/crm/notifications/target-options/stores',
  summary: 'Get stores available for manual notification targeting',
  description:
    'Returns operating stores within the creator scope defined by I-03. Managers can target all stores.',
  tags: ['Notification CRUD'],
  query: GetManualNotificationTargetStoresQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetManualNotificationTargetStoresResponseSchema,
      description: 'Available target stores',
    },
    { status: 400, schema: ManualNotificationErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
  ],
});

export async function GET(request: NextRequest) {
  const authorization = authorizeManualNotificationTargetOptions(request);
  if (!authorization.ok) return authorization.response;

  const queryObject = Object.fromEntries(request.nextUrl.searchParams);
  const validation = GetManualNotificationTargetStoresQuerySchema.safeParse(queryObject);
  if (!validation.success) {
    return manualNotificationErrorResponse(
      400,
      validation.error.issues.map((issue) => issue.message).join(', '),
    );
  }

  const { page, limit, q }: GetManualNotificationTargetStoresQuery = validation.data;
  let stores = db.stores.getList().filter((store) => store.status === 'operating');

  if (authorization.allowedStoreIds !== null) {
    stores = stores.filter((store) => authorization.allowedStoreIds?.includes(store.id));
  }

  const search = normalizeManualNotificationTargetSearch(q ?? '');
  if (search) {
    stores = stores.filter((store) =>
      [store.name, store.club_code, store.store_id].some((value) =>
        normalizeManualNotificationTargetSearch(value ?? '').includes(search),
      ),
    );
  }

  stores.sort((left, right) => left.store_id.localeCompare(right.store_id, 'ja'));
  const totalItems = stores.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const response: GetManualNotificationTargetStoresResponse = {
    items: stores.slice(start, start + limit).map((store) => ({ id: store.id, name: store.name })),
    pagination: { page, limit, totalItems, totalPages },
  };

  return NextResponse.json(GetManualNotificationTargetStoresResponseSchema.parse(response));
}
