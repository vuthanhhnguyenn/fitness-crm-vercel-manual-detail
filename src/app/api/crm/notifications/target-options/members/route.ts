import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetManualNotificationTargetMembersQuery,
  GetManualNotificationTargetMembersQuerySchema,
  type GetManualNotificationTargetMembersResponse,
  GetManualNotificationTargetMembersResponseSchema,
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
  path: '/crm/notifications/target-options/members',
  summary: 'Get members available for manual notification targeting',
  description:
    'Returns active members within the creator scope defined by I-03. Managers can target all stores.',
  tags: ['Notification CRUD'],
  query: GetManualNotificationTargetMembersQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetManualNotificationTargetMembersResponseSchema,
      description: 'Available target members',
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
  const validation = GetManualNotificationTargetMembersQuerySchema.safeParse(queryObject);
  if (!validation.success) {
    return manualNotificationErrorResponse(
      400,
      validation.error.issues.map((issue) => issue.message).join(', '),
    );
  }

  const { page, limit, q, brandGroup, contractType }: GetManualNotificationTargetMembersQuery =
    validation.data;
  let members = db.members.getList().filter((member) => member.status === 'active');

  if (authorization.allowedStoreIds !== null) {
    members = members.filter((member) => authorization.allowedStoreIds?.includes(member.store_id));
  }

  const search = normalizeManualNotificationTargetSearch(q ?? '');
  if (search) {
    members = members.filter((member) =>
      [member.member_number, member.old_member_number, member.name_kanji, member.name_kana].some(
        (value) => normalizeManualNotificationTargetSearch(value).includes(search),
      ),
    );
  }

  if (brandGroup) {
    members = members.filter((member) => member.brand_group === brandGroup);
  }
  if (contractType) {
    members = members.filter((member) => member.contract_type === contractType);
  }

  members.sort((left, right) => left.member_number.localeCompare(right.member_number, 'ja'));
  const totalItems = members.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;
  const response: GetManualNotificationTargetMembersResponse = {
    items: members.slice(start, start + limit).map((member) => ({
      id: member.id,
      name: member.name_kanji,
      memberNumber: member.member_number,
      storeName: member.store_name,
    })),
    pagination: { page, limit, totalItems, totalPages },
  };

  return NextResponse.json(GetManualNotificationTargetMembersResponseSchema.parse(response));
}
