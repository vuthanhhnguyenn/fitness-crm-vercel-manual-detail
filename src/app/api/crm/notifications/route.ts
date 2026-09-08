import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import type { ManualNotificationRow } from '@/app/api/_mock-db/types/manual-notifications.type';
import {
  GetManualNotificationsQuerySchema,
  type GetManualNotificationsResponse,
  GetManualNotificationsResponseSchema,
  ManualNotificationErrorResponseSchema,
  ManualNotificationListItemSchema,
  ManualNotificationUpsertBodySchema,
  ManualNotificationUpsertResponseSchema,
} from '@/app/api/_schemas/manual-notification.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';

import { getManualNotificationSelectedBrand } from '@/lib/utils/manual-notification-target.util';

import { Permission } from '@/types/permission.type';
import type { UserRole } from '@/types/permission.type';

import {
  canReadManualNotification,
  getManualNotificationValidationScope,
} from './_lib/manual-notification-access.util';
import { manualNotificationErrorResponse } from './_lib/manual-notification-error.util';
import {
  countManualNotificationTarget,
  getManualNotificationRowTargetCount,
} from './_lib/manual-notification-target-count.util';
import {
  buildManualNotificationRow,
  validateManualNotificationTarget,
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

function projectRowForList(row: ManualNotificationRow): ManualNotificationRow {
  if (row.status === 'sent') return row;
  return {
    ...row,
    targetCount: getManualNotificationRowTargetCount(row),
  };
}

function targetSearchText(item: ManualNotificationRow): string {
  switch (item.target.type) {
    case 'all_members':
      return '全会員';
    case 'brands':
      return getManualNotificationSelectedBrand(item.target.brands) ?? '';
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

  const comparison =
    field === 'id'
      ? first.id.localeCompare(second.id, undefined, { numeric: true })
      : String(first[field]).localeCompare(String(second[field]), 'ja');
  return comparison || first.id.localeCompare(second.id, undefined, { numeric: true });
}

export async function GET(request: NextRequest) {
  const auth = getAuthUserFromRequest(request);
  if (!auth.ok) {
    return manualNotificationErrorResponse(auth.status, 'この操作を実行する権限がありません');
  }

  if (!hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsView])) {
    return manualNotificationErrorResponse(403, 'この操作を実行する権限がありません');
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
    return manualNotificationErrorResponse(400, '検索条件に誤りがあります');
  }

  const { includeTotalAll, page, limit, sort, order, status, channel, targetType, q } =
    parsedQuery.data;
  let baseline = db.manualNotifications.getList().filter((item) => item.deletedAt === null);

  baseline = baseline.filter((item) => canReadManualNotification(auth.user, item));

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
    .map((row) => ManualNotificationListItemSchema.parse(projectRowForList(row)));

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
    return manualNotificationErrorResponse(auth.status, 'この操作を実行する権限がありません');
  }
  if (!hasPermissions(auth.user.role as UserRole, [Permission.ManualNotificationsCreate])) {
    return manualNotificationErrorResponse(403, 'この操作を実行する権限がありません');
  }

  const parsed = ManualNotificationUpsertBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return manualNotificationErrorResponse(400, '通知内容が不正です');
  }

  const body = parsed.data;
  const allowedStoreIds = getManualNotificationValidationScope(auth.user);
  const targetValidationError = validateManualNotificationTarget(body.target, allowedStoreIds);
  if (targetValidationError === 'not_found') {
    return manualNotificationErrorResponse(400, '配信対象が存在しません');
  }
  if (targetValidationError === 'out_of_scope') {
    return manualNotificationErrorResponse(403, '所属店舗以外の会員には配信できません');
  }

  const timingError =
    body.intent === 'submit' ? validateManualNotificationTiming(body.timing) : undefined;
  if (timingError) {
    return manualNotificationErrorResponse(400, timingError);
  }

  const targetCount = countManualNotificationTarget(body.target, allowedStoreIds);
  if (body.intent === 'submit' && targetCount === 0) {
    return manualNotificationErrorResponse(400, '配信対象の会員が存在しません');
  }

  const row = db.manualNotifications.create(
    buildManualNotificationRow({
      body,
      targetCount,
      createdByUserId: auth.user.id,
      allowedStoreIds,
    }),
  );

  const creator = db.users.getById(row.createdByUserId);
  return NextResponse.json(
    ManualNotificationUpsertResponseSchema.parse({
      item: {
        ...row,
        createdBy: creator?.name ?? row.createdByUserId,
      },
    }),
    { status: 201 },
  );
}
