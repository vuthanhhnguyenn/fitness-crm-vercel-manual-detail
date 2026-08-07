import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { GetActiveTermsQuery } from '@/app/api/_schemas/terms.schema';
import {
  ActiveTermsResponseSchema,
  GetActiveTermsQuerySchema,
  TermsErrorResponseSchema,
} from '@/app/api/_schemas/terms.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/terms/active',
  summary: 'Get active terms for mobile flows',
  description: 'Scaffold for the mobile-facing active terms route.',
  tags: ['Terms'],
  query: GetActiveTermsQuerySchema,
  responses: [
    { status: 200, schema: ActiveTermsResponseSchema, description: 'Active terms list' },
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

    const validationResult = GetActiveTermsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return buildErrorResponse(400, errors, '取得条件が不正です');
    }

    const query: GetActiveTermsQuery = validationResult.data;
    return NextResponse.json({ items: db.terms.getActive(query) }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/terms/active error:', error);
    return buildErrorResponse(500, 'Failed to fetch active terms', '有効規約の取得に失敗しました');
  }
}
