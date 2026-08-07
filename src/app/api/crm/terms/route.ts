import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { CreateTermsBody, TermsListQuery } from '@/app/api/_schemas/terms.schema';
import {
  CreateTermsBodySchema,
  TermsDetailSchema,
  TermsErrorResponseSchema,
  TermsListQuerySchema,
  TermsListResponseSchema,
} from '@/app/api/_schemas/terms.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/terms',
  summary: 'List terms documents',
  description: 'Scaffold for the admin terms list route.',
  tags: ['Terms'],
  query: TermsListQuerySchema,
  responses: [
    { status: 200, schema: TermsListResponseSchema, description: 'Terms list' },
    { status: 400, schema: TermsErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: TermsErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/terms',
  summary: 'Create an original terms document',
  description: 'Scaffold for the original terms creation route.',
  tags: ['Terms'],
  requestBody: {
    schema: CreateTermsBodySchema,
    description: 'Original terms create payload',
  },
  responses: [
    { status: 201, schema: TermsDetailSchema, description: 'Created' },
    { status: 400, schema: TermsErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: TermsErrorResponseSchema, description: 'Internal server error' },
  ],
});

function buildErrorResponse(status: number, message: string, userMessage = message) {
  return NextResponse.json(
    {
      code: `TERMS_${status}`,
      message,
      userMessage,
      traceId: null,
    },
    { status },
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObj: Record<string, string | undefined> = {};

    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = TermsListQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return buildErrorResponse(400, errors, '検索条件が不正です');
    }

    const query: TermsListQuery = validationResult.data;
    return NextResponse.json(db.terms.list(query), { status: 200 });
  } catch (error) {
    console.error('GET /crm/terms error:', error);
    return buildErrorResponse(500, 'Failed to fetch terms list', '規約一覧の取得に失敗しました');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validationResult = CreateTermsBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return buildErrorResponse(400, errors, '入力内容に誤りがあります');
    }

    const payload: CreateTermsBody = validationResult.data;
    const created = db.terms.createOriginal(payload);
    const detail = db.terms.getDetail(created.id);

    if (!detail) {
      return buildErrorResponse(500, 'Failed to load created term', '規約の登録に失敗しました');
    }

    return NextResponse.json(detail, { status: 201 });
  } catch (error) {
    console.error('POST /crm/terms error:', error);
    return buildErrorResponse(500, 'Failed to create term', '規約の登録に失敗しました');
  }
}
