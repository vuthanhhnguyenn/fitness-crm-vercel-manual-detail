import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { toTermsDetailResponse } from '@/app/api/_mock-db/tables/terms.table';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  DeleteTermsResponseSchema,
  TermsDetailResponseSchema,
  UpdateTermsBodySchema,
  UpdateTermsResponseSchema,
} from '@/app/api/_schemas/terms.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { getRequesterBrandScope } from '@/app/api/crm/terms/_lib/brand-scope';

const NOT_FOUND_MESSAGE = '該当する規約文書が見つかりません。';

registerRoute({
  method: 'get',
  path: '/crm/terms/{id}',
  summary: 'Get terms document detail',
  description: 'Fetch a single terms document with its version history and related-terms reference',
  tags: ['Terms'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Terms document ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: TermsDetailResponseSchema, description: 'Terms document detail' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role === 'Trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const brandScope = getRequesterBrandScope(authResult.user);
    const row = db.terms.getById(id, brandScope);
    if (!row) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(toTermsDetailResponse(row, db.terms._rows));
  } catch (error) {
    console.error('GET /crm/terms/[id] error:', error);
    return NextResponse.json({ error: '規約文書の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'patch',
  path: '/crm/terms/{id}',
  summary: 'Update a terms document',
  description:
    'Partially update a terms document; termsType/brandEnum are immutable (System/Headquarter role only)',
  tags: ['Terms'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Terms document ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateTermsBodySchema,
    description: 'Terms document update payload',
  },
  responses: [
    { status: 200, schema: UpdateTermsResponseSchema, description: 'Terms document updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateTermsBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 },
      );
    }

    const result = db.terms.update(id, validationResult.data, authResult.user.name);
    if (result === 'not_found') {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(toTermsDetailResponse(result, db.terms._rows));
  } catch (error) {
    console.error('PATCH /crm/terms/[id] error:', error);
    return NextResponse.json({ error: '規約文書の更新に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'delete',
  path: '/crm/terms/{id}',
  summary: 'Delete a terms document',
  description:
    'Logically delete a terms document by id; sibling lineage members are untouched (System/Headquarter role only)',
  tags: ['Terms'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Terms document ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: DeleteTermsResponseSchema, description: 'Terms document deleted' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const result = db.terms.delete(id);
    if (result === 'not_found') {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ message: '規約を削除しました' });
  } catch (error) {
    console.error('DELETE /crm/terms/[id] error:', error);
    return NextResponse.json({ error: '規約文書の削除に失敗しました' }, { status: 500 });
  }
}
