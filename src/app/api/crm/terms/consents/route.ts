import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { RecordTermsConsentBody } from '@/app/api/_schemas/terms.schema';
import {
  RecordTermsConsentBodySchema,
  RecordTermsConsentResponseSchema,
  TermsErrorResponseSchema,
} from '@/app/api/_schemas/terms.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/terms/consents',
  summary: 'Record terms consent',
  description: 'Scaffold for the terms consent route.',
  tags: ['Terms'],
  requestBody: {
    schema: RecordTermsConsentBodySchema,
    description: 'Terms consent payload',
  },
  responses: [
    { status: 200, schema: RecordTermsConsentResponseSchema, description: 'Recorded' },
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

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validationResult = RecordTermsConsentBodySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return buildErrorResponse(400, errors, '入力内容に誤りがあります');
    }

    const payload: RecordTermsConsentBody = validationResult.data;
    const recorded = db.terms.recordConsents(payload);
    return NextResponse.json({ recorded }, { status: 200 });
  } catch (error) {
    console.error('POST /crm/terms/consents error:', error);
    return buildErrorResponse(500, 'Failed to record consent', '同意記録の保存に失敗しました');
  }
}
