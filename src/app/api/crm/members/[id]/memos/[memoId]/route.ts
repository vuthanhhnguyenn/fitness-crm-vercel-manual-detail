import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  type UpdateMemoRequest,
  UpdateMemoRequestSchema,
  UpdateMemoResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

import { deleteMemo, updateMemo } from '../route';

// Register OpenAPI documentation for PUT route
registerRoute({
  method: 'put',
  path: '/crm/members/{id}/memos/{memoId}',
  summary: 'Update member memo',
  description: 'Update a memo for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
    {
      name: 'memoId',
      in: 'path',
      required: true,
      description: 'Memo ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateMemoRequestSchema,
    description: 'Updated memo details',
  },
  responses: [
    {
      status: 200,
      schema: UpdateMemoResponseSchema,
      description: 'Memo updated successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Memo not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// Register OpenAPI documentation for DELETE route
registerRoute({
  method: 'delete',
  path: '/crm/members/{id}/memos/{memoId}',
  summary: 'Delete member memo',
  description: 'Delete a memo for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
    {
      name: 'memoId',
      in: 'path',
      required: true,
      description: 'Memo ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: z
        .object({
          id: z.string(),
        })
        .openapi({
          title: 'DeleteMemoResponse',
          description: 'Empty response on successful delete',
        }),
      description: 'Memo deleted successfully',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Memo not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> },
) {
  try {
    const { id, memoId } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = UpdateMemoRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: UpdateMemoRequest = validationResult.data;
    const updates: Partial<{ type: 'caution' | 'vip' | 'other'; content: string }> = {};
    if (validatedBody.type !== undefined) updates.type = validatedBody.type;
    if (validatedBody.content !== undefined) {
      updates.content = validatedBody.content.trim();
    }

    const memo = updateMemo(id, memoId, updates);
    if (!memo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    return NextResponse.json(memo);
  } catch {
    return NextResponse.json({ error: 'Failed to update memo' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> },
) {
  try {
    const { id, memoId } = await params;
    const deleted = deleteMemo(id, memoId);
    if (!deleted) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }
    return NextResponse.json({ id: memoId });
  } catch {
    return NextResponse.json({ error: 'Failed to delete memo' }, { status: 500 });
  }
}
