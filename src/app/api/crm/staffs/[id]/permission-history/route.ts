import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetStaffPermissionHistoryQuery,
  GetStaffPermissionHistoryQuerySchema,
  type GetStaffPermissionHistoryResponse,
  GetStaffPermissionHistoryResponseSchema,
} from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/staffs/{id}/permission-history',
  summary: 'Get staff permission change history',
  description: 'Paginated, newest-first permission change history for a staff account',
  tags: ['Staffs'],
  parameters: [
    { name: 'id', in: 'path', required: true, description: 'Staff ID', schema: { type: 'string' } },
  ],
  query: GetStaffPermissionHistoryQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetStaffPermissionHistoryResponseSchema,
      description: 'Permission change history',
    },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Staff not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const caller = authResult.user;

    const { id } = await params;
    const existing = db.staffs.getDetailById(id);
    if (!existing) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    const isHq = caller.role === 'System' || caller.role === 'Headquarter';
    const isSelfAccount = Boolean(caller.staff_id) && caller.staff_id === existing.staff_id;
    // Role-agnostic, matching detail-view read access (GET /crm/staffs/{id}): a Manager may
    // view the history of any staff in a managed store, regardless of that staff's role.
    const isManagerOfTarget =
      caller.role === 'Manager' &&
      existing.staff_linkage.type === 'direct_store' &&
      !!existing.staff_linkage.store_id &&
      (caller.managed_store_ids ?? []).includes(existing.staff_linkage.store_id);
    if (!isHq && !isSelfAccount && !isManagerOfTarget) {
      return NextResponse.json(
        { error: 'この変更履歴を閲覧する権限がありません' },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });
    const validationResult = GetStaffPermissionHistoryQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const { page, limit }: GetStaffPermissionHistoryQuery = validationResult.data;

    const allEntries = db.staffs.getPermissionHistory(id);
    const total = allEntries.length;
    const total_pages = total === 0 ? 0 : Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    const response: GetStaffPermissionHistoryResponse = {
      history: allEntries.slice(startIndex, startIndex + limit),
      pagination: { page, limit, total, total_pages },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching permission history:', error);
    return NextResponse.json({ error: '変更履歴の取得に失敗しました' }, { status: 500 });
  }
}
