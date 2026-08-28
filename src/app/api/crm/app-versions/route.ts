import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  AppVersionRecord,
  CreateAppVersionBodySchema,
  ErrorResponseSchema,
  GetAppVersionResponseSchema,
  GetAppVersionsQueryParamsSchema,
  GetAppVersionsResponseSchema,
} from '@/app/api/_schemas/app-version.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/app-versions',
  summary: 'Get app versions',
  description: 'Get paginated app version records with brand filter and sorting',
  tags: ['AppVersions'],
  query: GetAppVersionsQueryParamsSchema,
  responses: [
    {
      status: 200,
      schema: GetAppVersionsResponseSchema,
      description: 'App version list',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/app-versions',
  summary: 'Create app version',
  description: 'Register a new app version record',
  tags: ['AppVersions'],
  requestBody: {
    schema: CreateAppVersionBodySchema,
    description: 'App version create payload',
  },
  responses: [
    {
      status: 201,
      schema: GetAppVersionResponseSchema,
      description: 'App version created',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Validation error',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetAppVersionsQueryParamsSchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { page, limit, sort, order, brandEnum } = validationResult.data;

    let items: AppVersionRecord[] = db.appVersions.getList();
    const totalAllItems = items.length;

    if (brandEnum) {
      items = items.filter((item) => item.brandEnum === brandEnum);
    }

    items = [...items].sort((left, right) => {
      const comparison =
        sort === 'createdAt'
          ? left.createdAt.localeCompare(right.createdAt)
          : left.releaseDate.localeCompare(right.releaseDate);
      return order === 'desc' ? -comparison : comparison;
    });

    const totalItems = items.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      items: paginated,
      totalAllItems,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /crm/app-versions error:', error);
    return NextResponse.json(
      { error: 'アプリバージョン一覧の取得に失敗しました' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateAppVersionBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const created = db.appVersions.create(validationResult.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /crm/app-versions error:', error);
    return NextResponse.json({ error: 'アプリバージョンの作成に失敗しました' }, { status: 500 });
  }
}
