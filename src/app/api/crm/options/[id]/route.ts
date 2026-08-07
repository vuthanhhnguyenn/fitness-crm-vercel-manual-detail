import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeleteOptionMasterRequestSchema,
  DeleteOptionMasterResponseSchema,
  ErrorResponseSchema,
  GetOptionMasterDetailResponseSchema,
  UpdateOptionMasterResponseSchema,
  UpsertOptionMasterBodySchema,
} from '@/app/api/_schemas/option-master.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/options/{id}',
  summary: 'Get option master detail',
  description: 'Get detailed information for a specific option master',
  tags: ['Options'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Option ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: GetOptionMasterDetailResponseSchema, description: 'Option detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/options/{id}',
  summary: 'Delete option master',
  description: 'Delete an option master when it has no linked contracts or active members',
  tags: ['Options'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Option ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: DeleteOptionMasterRequestSchema,
    description: '削除理由',
  },
  responses: [
    {
      status: 200,
      schema: DeleteOptionMasterResponseSchema,
      description: 'Deleted successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Deletion blocked or validation error',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/options/{id}',
  summary: 'Update option master',
  description: 'Update an existing option master by ID',
  tags: ['Options'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Option ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpsertOptionMasterBodySchema,
    description: 'オプション更新リクエスト',
  },
  responses: [
    {
      status: 200,
      schema: UpdateOptionMasterResponseSchema,
      description: 'Updated successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = db.optionMasters.getById(id);

    if (!detail) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    return NextResponse.json({ option: detail }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/options/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = DeleteOptionMasterRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const detail = db.optionMasters.getById(id);
    if (!detail) {
      return NextResponse.json({ error: 'オプションが見つかりません' }, { status: 404 });
    }

    if (detail.member_count > 0) {
      return NextResponse.json(
        {
          error: `利用会員が ${detail.member_count.toLocaleString()} 名存在するため削除できません`,
        },
        { status: 400 },
      );
    }

    if (detail.linked_contracts > 0) {
      return NextResponse.json(
        { error: `紐付け契約が ${detail.linked_contracts} 件存在するため削除できません` },
        { status: 400 },
      );
    }

    const deleted = db.optionMasters.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'オプションが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: 'オプションを削除しました' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /crm/options/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = UpsertOptionMasterBodySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const existing = db.optionMasters.getById(id);
    if (!existing) {
      return NextResponse.json({ error: 'オプションが見つかりません' }, { status: 404 });
    }

    const updated = db.optionMasters.update(id, validation.data);
    if (!updated) {
      return NextResponse.json({ error: 'オプションが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'オプションを更新しました', option: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/options/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
