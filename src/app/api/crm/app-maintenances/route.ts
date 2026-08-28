import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  toAppMaintenanceDetailResponse,
  toAppMaintenanceItemResponse,
} from '@/app/api/_mock-db/tables/app-maintenance.table';
import {
  CreateAppMaintenanceBodySchema,
  CreateAppMaintenanceResponseSchema,
  type GetAppMaintenancesQuery,
  GetAppMaintenancesQuerySchema,
  GetAppMaintenancesResponseSchema,
} from '@/app/api/_schemas/app-maintenance.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/app-maintenances',
  summary: 'List app maintenance windows',
  description: 'Get paginated app maintenance windows with search, filters, and sorting',
  tags: ['App Maintenance'],
  query: GetAppMaintenancesQuerySchema,
  responses: [
    { status: 200, schema: GetAppMaintenancesResponseSchema, description: 'App maintenance list' },
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
    // View (list/detail) allowed for all roles except Trainer (権限マトリクス, 260713_v2)
    if (authResult.user.role === 'Trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetAppMaintenancesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const query: GetAppMaintenancesQuery = validationResult.data;
    const { rows, total, totalAll } = db.appMaintenances.list(query);

    return NextResponse.json({
      items: rows.map(toAppMaintenanceItemResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
        totalAllItems: totalAll,
      },
    });
  } catch (error) {
    console.error('GET /crm/app-maintenances error:', error);
    return NextResponse.json(
      { error: 'アプリメンテナンス一覧の取得に失敗しました' },
      { status: 500 },
    );
  }
}

registerRoute({
  method: 'post',
  path: '/crm/app-maintenances',
  summary: 'Create an app maintenance window',
  description: 'Create a new app maintenance window (System/Headquarter roles only)',
  tags: ['App Maintenance'],
  requestBody: {
    schema: CreateAppMaintenanceBodySchema,
    description: 'App maintenance create payload',
  },
  responses: [
    {
      status: 201,
      schema: CreateAppMaintenanceResponseSchema,
      description: 'App maintenance created',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
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
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = CreateAppMaintenanceBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: validationResult.error.issues.map((issue) => issue.message).join(', '),
        },
        { status: 400 },
      );
    }

    const result = db.appMaintenances.create(validationResult.data, authResult.user.id);
    if (result === 'period_conflict') {
      return NextResponse.json(
        { error: '登録しようとしている期間は既存のメンテナンス期間と重複しています。' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: 'メンテナンス設定を登録しました',
        appMaintenance: toAppMaintenanceDetailResponse(result),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /crm/app-maintenances error:', error);
    return NextResponse.json({ error: 'メンテナンス設定の登録に失敗しました' }, { status: 500 });
  }
}
