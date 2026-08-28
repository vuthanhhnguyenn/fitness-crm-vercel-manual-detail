import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  toTermsDetailResponse,
  toTermsListItemResponse,
} from '@/app/api/_mock-db/tables/terms.table';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  CreateTermsBodySchema,
  CreateTermsResponseSchema,
  type GetTermsQuery,
  GetTermsQuerySchema,
  GetTermsResponseSchema,
} from '@/app/api/_schemas/terms.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { getRequesterBrandScope } from '@/app/api/crm/terms/_lib/brand-scope';

registerRoute({
  method: 'get',
  path: '/crm/terms',
  summary: 'List terms documents',
  description:
    'Get paginated terms documents with type/brand/status filters, search, and pagination',
  tags: ['Terms'],
  query: GetTermsQuerySchema,
  responses: [
    { status: 200, schema: GetTermsResponseSchema, description: 'Terms document list' },
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
    if (authResult.user.role === 'Trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetTermsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const query: GetTermsQuery = validationResult.data;
    const brandScope = getRequesterBrandScope(authResult.user);
    const { rows, total, totalAllItems } = db.terms.list(query, brandScope);

    return NextResponse.json({
      items: rows.map(toTermsListItemResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalAllItems,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error('GET /crm/terms error:', error);
    return NextResponse.json({ error: '規約文書一覧の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'post',
  path: '/crm/terms',
  summary: 'Create a terms document',
  description:
    'Create a new terms document, or a new version when parentTermsId/prevTermsId are provided (System/Headquarter role only)',
  tags: ['Terms'],
  requestBody: {
    schema: CreateTermsBodySchema,
    description: 'Terms document create payload',
  },
  responses: [
    { status: 201, schema: CreateTermsResponseSchema, description: 'Terms document created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
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
    const validationResult = CreateTermsBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 },
      );
    }

    const result = db.terms.create(validationResult.data, authResult.user.name);
    if (result === 'invalid_lineage_ref') {
      return NextResponse.json(
        { error: '参照先の規約文書が見つからないか、削除済みです。' },
        { status: 400 },
      );
    }

    return NextResponse.json(toTermsDetailResponse(result, db.terms._rows), { status: 201 });
  } catch (error) {
    console.error('POST /crm/terms error:', error);
    return NextResponse.json({ error: '規約文書の登録に失敗しました' }, { status: 500 });
  }
}
