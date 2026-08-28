import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  toCrmMaintenanceDetailResponse,
  toCrmMaintenanceItemResponse,
} from '@/app/api/_mock-db/tables/crm-maintenance.table';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  CreateCrmMaintenanceBodySchema,
  CreateCrmMaintenanceResponseSchema,
  type GetCrmMaintenancesQuery,
  GetCrmMaintenancesQuerySchema,
  GetCrmMaintenancesResponseSchema,
} from '@/app/api/_schemas/crm-maintenance.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/maintenances',
  summary: 'List CRM maintenance windows',
  description: 'Get paginated CRM maintenance windows with search, status filter, and sorting',
  tags: ['CRM Maintenance'],
  query: GetCrmMaintenancesQuerySchema,
  responses: [
    { status: 200, schema: GetCrmMaintenancesResponseSchema, description: 'CRM maintenance list' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetCrmMaintenancesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const query: GetCrmMaintenancesQuery = validationResult.data;
    const { rows, total, totalAll } = db.crmMaintenances.list(query);

    return NextResponse.json({
      items: rows.map((row) =>
        toCrmMaintenanceItemResponse(row, db.crmMaintenances.getAllowedStaffIds(row.id).length),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
        totalAllItems: totalAll,
      },
    });
  } catch (error) {
    console.error('GET /crm/maintenances error:', error);
    return NextResponse.json({ error: 'CRMメンテナンス一覧の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'post',
  path: '/crm/maintenances',
  summary: 'Create a CRM maintenance window',
  description: 'Create a new CRM maintenance window (System role only)',
  tags: ['CRM Maintenance'],
  requestBody: {
    schema: CreateCrmMaintenanceBodySchema,
    description: 'CRM maintenance create payload',
  },
  responses: [
    {
      status: 201,
      schema: CreateCrmMaintenanceResponseSchema,
      description: 'CRM maintenance created',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Allowed user not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Period conflict' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = CreateCrmMaintenanceBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 },
      );
    }

    const result = db.crmMaintenances.create(validationResult.data, authResult.user.id);
    if (result === 'period_conflict') {
      return NextResponse.json(
        { error: '登録しようとしている期間は既存のメンテナンス期間と重複しています。' },
        { status: 409 },
      );
    }
    if (result === 'unknown_staff_id') {
      return NextResponse.json({ error: '該当するユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'CRMメンテナンスを登録しました',
        crmMaintenance: toCrmMaintenanceDetailResponse(
          result,
          db.crmMaintenances.getAllowedUsers(result.id),
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /crm/maintenances error:', error);
    return NextResponse.json({ error: 'CRMメンテナンスの登録に失敗しました' }, { status: 500 });
  }
}
