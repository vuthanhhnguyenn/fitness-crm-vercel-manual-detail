import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { UpdateTermsBody } from '@/app/api/_schemas/terms.schema';
import {
  DeleteTermsResponseSchema,
  TermsDetailSchema,
  TermsErrorResponseSchema,
  UpdateTermsBodySchema,
} from '@/app/api/_schemas/terms.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/terms/{id}',
  summary: 'Get terms detail',
  description: 'Scaffold for the terms detail route.',
  tags: ['Terms'],
  responses: [
    { status: 200, schema: TermsDetailSchema, description: 'Terms detail' },
    { status: 404, schema: TermsErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: TermsErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/terms/{id}',
  summary: 'Update a terms document',
  description: 'Scaffold for the terms edit route.',
  tags: ['Terms'],
  requestBody: {
    schema: UpdateTermsBodySchema,
    description: 'Terms update payload',
  },
  responses: [
    { status: 200, schema: TermsDetailSchema, description: 'Updated' },
    { status: 400, schema: TermsErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: TermsErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: TermsErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/terms/{id}',
  summary: 'Delete a terms document logically',
  description: 'Scaffold for the logical delete route.',
  tags: ['Terms'],
  responses: [
    { status: 200, schema: DeleteTermsResponseSchema, description: 'Deleted' },
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = db.terms.getDetail(id);

    if (!detail) {
      return buildErrorResponse(404, 'Terms document not found', '規約が見つかりません');
    }

    const responseValidationResult = TermsDetailSchema.safeParse(detail);
    if (!responseValidationResult.success) {
      console.error('GET /crm/terms/[id] response validation error:', {
        id,
        issues: responseValidationResult.error.issues,
      });
      return buildErrorResponse(
        500,
        'Terms detail response does not match schema',
        '規約詳細のレスポンス形式が不正です',
      );
    }

    return NextResponse.json(responseValidationResult.data, { status: 200 });
  } catch (error) {
    console.error('GET /crm/terms/[id] error:', error);
    return buildErrorResponse(500, 'Failed to fetch terms detail', '規約詳細の取得に失敗しました');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return buildErrorResponse(400, 'Invalid request body', '入力内容に誤りがあります');
    }

    const immutableKeys = ['id', 'termsType', 'brandEnum', 'parentTermsId', 'prevTermsId'];
    const attemptedImmutableKey = immutableKeys.find((key) => key in body);
    if (attemptedImmutableKey) {
      return buildErrorResponse(
        400,
        `Field ${attemptedImmutableKey} is immutable`,
        '変更できない項目が含まれています',
      );
    }

    const validationResult = UpdateTermsBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return buildErrorResponse(400, errors, '入力内容に誤りがあります');
    }

    const existing = db.terms.getById(id);
    if (!existing) {
      return buildErrorResponse(404, 'Terms document not found', '規約が見つかりません');
    }

    const updated = db.terms.update(id, validationResult.data as UpdateTermsBody);
    if (!updated) {
      return buildErrorResponse(404, 'Terms document not found', '規約が見つかりません');
    }

    const detail = db.terms.getDetail(id);
    if (!detail) {
      return buildErrorResponse(500, 'Failed to load updated term', '規約の更新に失敗しました');
    }

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    console.error('PATCH /crm/terms/[id] error:', error);
    return buildErrorResponse(500, 'Failed to update term', '規約の更新に失敗しました');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = db.terms.getById(id);

    if (!existing) {
      return buildErrorResponse(404, 'Terms document not found', '規約が見つかりません');
    }

    if (existing.deletedAt) {
      return buildErrorResponse(400, 'Terms document already deleted', '規約はすでに削除済みです');
    }

    const deleted = db.terms.logicalDelete(id);
    if (!deleted) {
      return buildErrorResponse(500, 'Failed to delete term', '規約の削除に失敗しました');
    }

    return NextResponse.json({ message: '規約を削除しました' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /crm/terms/[id] error:', error);
    return buildErrorResponse(500, 'Failed to delete term', '規約の削除に失敗しました');
  }
}
