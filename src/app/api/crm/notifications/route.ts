import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import type { ManualNotificationRow } from '@/app/api/_mock-db/types/manual-notifications.type';
import {
  GetManualNotificationsQuerySchema,
  type GetManualNotificationsResponse,
  GetManualNotificationsResponseSchema,
  type ManualNotificationErrorResponse,
  ManualNotificationErrorResponseSchema,
  ManualNotificationListItemSchema,
  ManualNotificationUpsertBodySchema,
  ManualNotificationUpsertResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { Permission } from '@/types/permission.type';
import type { UserRole } from '@/types/permission.type';

import {
  buildManualNotificationRow,
  isManualNotificationTargetOutOfScope,
  validateManualNotificationTiming,
} from './_lib/manual-notification-upsert.util';

registerRoute({
  method: 'get',
  path: '/crm/notifications',
  summary: 'List manual notifications in caller scope',
  description:
    'Lists Manual Notifications for I-03 with search, target/channel filters, sorting and pagination.',
  tags: ['Notification CRUD'],
  query: GetManualNotificationsQuerySchema,
  responses: [
    { status: 200, schema: GetManualNotificationsResponseSchema, description: 'Notification list' },
    { status: 400, schema: ManualNotificationErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/notifications',
  summary: 'Create a manual notification',
  description: 'Create a manual notification as draft or submit it for delivery',
  tags: ['Notification CRUD'],
  requestBody: { schema: ManualNotificationUpsertBodySchema },
  responses: [
    {
      status: 201,
      schema: ManualNotificationUpsertResponseSchema,
      description: 'Notification created',
    },
    { status: 400, schema: ManualNotificationErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ManualNotificationErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ManualNotificationErrorResponseSchema, description: 'Forbidden' },
  ],
});

type SortableField = 'id' | 'title' | 'status' | 'updatedAt';

function errorResponse(
  status: 400 | 401 | 403,
  code: 'E-VAL-001' | 'E-AUTH-001' | 'E-AUTH-006',
  message: string,
  userMessage: string,
  details?: Record<string, unknown>,
) {
  const body: ManualNotificationErrorResponse = {
    code,
    message,
    userMessage,
    traceId: crypto.randomUUID(),
    ...(details ? { details } : {}),
  };
  return NextResponse.json(body, { status });
}

function targetSearchText(item: ManualNotificationRow): string {
  switch (item.target.type) {
    case 'all_members':
      return '全会員';
    case 'brands':
      return item.target.brands.join(' ');
    case 'stores':
      return item.target.stores.map((store) => `${store.id} ${store.name}`).join(' ');
    case 'contract_type':
      return item.target.contractType;
    case 'membership_duration':
      return `${item.target.condition} ${item.target.months}`;
    case 'dynamic_attribute':
      return item.target.attribute;
    case 'members':
      return item.target.members.map((member) => `${member.id} ${member.name}`).join(' ');
  }
}

function compareRows(
  first: ManualNotificationRow,
  second: ManualNotificationRow,
  field: SortableField,
) {
  if (field === 'updatedAt') {
    const comparison = new Date(first.updatedAt).getTime() - new Date(second.updatedAt).getTime();
    return comparison || first.id.localeCompare(second.id);
  }

  const comparison = String(first[field]).localeCompare(String(second[field]), 'ja');
  return comparison || first.id.localeCompare(second.id);
}

export async function GET(request: NextRequest) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    const code = auth.status === 401 ? 'E-AUTH-001' : 'E-AUTH-006';
    return errorResponse(auth.status, code, auth.error, 'Authentication or authorization failed');
  }

  if (!hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsView])) {
    return errorResponse(
      403,
      'E-AUTH-006',
      'Manual notification capability is required',
      'You do not have permission to view manual notifications',
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const queryInput: Record<string, string | string[] | undefined> = {};
  searchParams.forEach((value, key) => {
    queryInput[key] = value;
  });

  for (const key of ['status', 'channel', 'targetType']) {
    const values = searchParams.getAll(key);
    if (values.length > 1) queryInput[key] = values;
  }

  const parsedQuery = GetManualNotificationsQuerySchema.safeParse(queryInput);
  if (!parsedQuery.success) {
    return errorResponse(
      400,
      'E-VAL-001',
      'Request query validation failed',
      'One or more query parameters are invalid',
      {
        issues: parsedQuery.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
      },
    );
  }

  const { includeTotalAll, page, limit, sort, order, status, channel, targetType, q } =
    parsedQuery.data;
  let baseline = db.manualNotifications.getList().filter((item) => item.deletedAt === null);

  const allowedStoreIds = getAllowedStoreIds(auth.user);
  const canMutate = hasPermissions(auth.user.role as UserRole, [
    Permission.ManualNotificationsCreate,
  ]);
  if (allowedStoreIds !== null) {
    if (allowedStoreIds.length === 0 && canMutate) {
      baseline = baseline.filter((item) => item.createdByUserId === auth.user.id);
    } else if (allowedStoreIds.length > 0 && canMutate) {
      baseline = baseline.filter(
        (item) =>
          item.createdByUserId === auth.user.id ||
          item.targetStoreIds.some((storeId) => allowedStoreIds.includes(storeId)),
      );
    }
  }

  const totalAllItems = baseline.length;
  let filtered = baseline;

  if (status?.length) {
    filtered = filtered.filter((item) => status.includes(item.status));
  }

  if (channel?.length) {
    filtered = filtered.filter((item) => channel.some((value) => item.channels.includes(value)));
  }

  if (targetType?.length) {
    filtered = filtered.filter((item) => targetType.includes(item.target.type));
  }

  const keyword = q?.toLocaleLowerCase('ja');
  if (keyword) {
    filtered = filtered.filter((item) =>
      `${item.id} ${item.title} ${targetSearchText(item)}`
        .toLocaleLowerCase('ja')
        .includes(keyword),
    );
  }

  filtered.sort((first, second) => {
    const comparison = compareRows(first, second, sort);
    return order === 'asc' ? comparison : -comparison;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const items = filtered
    .slice(start, start + limit)
    .map((row) => ManualNotificationListItemSchema.parse(row));

  const response: GetManualNotificationsResponse = {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      ...(includeTotalAll ? { totalAllItems } : {}),
    },
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    const code = auth.status === 401 ? 'E-AUTH-001' : 'E-AUTH-006';
    return errorResponse(auth.status, code, auth.error, 'Authentication or authorization failed');
  }
  if (!hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsCreate])) {
    return errorResponse(
      403,
      'E-AUTH-006',
      'Insufficient permissions',
      'この操作を実行する権限がありません',
    );
  }

  const parsed = ManualNotificationUpsertBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return errorResponse(400, 'E-VAL-001', 'Invalid notification payload', '通知内容が不正です');
  }

  const body = parsed.data;
  const allowedStoreIds = getAllowedStoreIds(auth.user);
  if (isManualNotificationTargetOutOfScope(body.target, allowedStoreIds)) {
    return errorResponse(
      403,
      'E-AUTH-006',
      'Target is outside the caller store scope',
      '所属店舗以外の会員には配信できません',
    );
  }

  const timingError =
    body.intent === 'submit' ? validateManualNotificationTiming(body.timing) : undefined;
  if (timingError) {
    return errorResponse(400, 'E-VAL-001', timingError, timingError);
  }

  const targetCount = db.manualNotifications.estimateTargetCount(body.target);
  if (body.intent === 'submit' && targetCount === 0) {
    return errorResponse(
      400,
      'E-VAL-001',
      'No eligible recipients',
      '配信対象の会員が存在しません',
    );
  }

  const row = db.manualNotifications.create(
    buildManualNotificationRow({
      body,
      targetCount,
      createdByUserId: auth.user.id,
    }),
  );

  const creator = db.users.getById(row.createdByUserId);
  return NextResponse.json(
    {
      item: {
        ...row,
        createdBy: creator?.name ?? row.createdByUserId,
      },
    },
    { status: 201 },
  );
}
