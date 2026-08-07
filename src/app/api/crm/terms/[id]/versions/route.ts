import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { CreateTermsVersionBody } from '@/app/api/_schemas/terms.schema';
import {
  CreateTermsVersionBodySchema,
  TermsDetailSchema,
  TermsErrorResponseSchema,
} from '@/app/api/_schemas/terms.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/terms/{id}/versions',
  summary: 'Create a new version from existing document',
  description: 'Scaffold for the new version route.',
  tags: ['Terms'],
  requestBody: {
    schema: CreateTermsVersionBodySchema,
    description: 'Version create payload',
  },
  responses: [
    { status: 201, schema: TermsDetailSchema, description: 'Created' },
    { status: 400, schema: TermsErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: TermsErrorResponseSchema, description: 'Not found' },
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    const validationResult = CreateTermsVersionBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return buildErrorResponse(400, errors, '入力内容に誤りがあります');
    }

    const existing = db.terms.getById(id);
    if (!existing) {
      return buildErrorResponse(404, 'Terms document not found', '規約が見つかりません');
    }

    if (existing.deletedAt) {
      return buildErrorResponse(
        400,
        'Cannot create version from a deleted document',
        '削除済みの規約からはバージョンを作成できません',
      );
    }

    const payload: CreateTermsVersionBody = validationResult.data;
    const created = db.terms.createVersion(id, payload);
    if (!created) {
      return buildErrorResponse(404, 'Source terms document not found', '元の規約が見つかりません');
    }

    const detail = db.terms.getDetail(created.id);
    if (!detail) {
      return buildErrorResponse(
        500,
        'Failed to load created version',
        'バージョンの作成に失敗しました',
      );
    }

    return NextResponse.json(detail, { status: 201 });
  } catch (error) {
    console.error('POST /crm/terms/[id]/versions error:', error);
    return buildErrorResponse(500, 'Failed to create version', 'バージョンの作成に失敗しました');
  }
}
