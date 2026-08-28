import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  PositionDetailSchema,
  UpdatePositionBodySchema,
  UpdatePositionResponseSchema,
} from '@/app/api/_schemas/position.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const pathParams = [
  {
    name: 'id',
    in: 'path' as const,
    required: true,
    description: 'Position ID',
    schema: { type: 'integer' },
  },
];

registerRoute({
  method: 'get',
  path: '/crm/positions/{id}',
  summary: 'Get position detail',
  description:
    'Position detail with the flat 36-key permission map for the edit/clone form (Y-01 FR-006)',
  tags: ['Positions'],
  parameters: pathParams,
  responses: [
    { status: 200, schema: PositionDetailSchema, description: 'Position detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/positions/{id}',
  summary: 'Update position master',
  description:
    'Partially updates a position master (Y-01 FR-006). role is immutable and not accepted; only provided permission keys are updated',
  tags: ['Positions'],
  parameters: pathParams,
  requestBody: {
    schema: UpdatePositionBodySchema,
    description: 'Position update payload',
  },
  responses: [
    { status: 200, schema: UpdatePositionResponseSchema, description: 'Position updated' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Duplicate (role, name)' },
    { status: 422, schema: ErrorResponseSchema, description: 'System-managed position' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/positions/{id}',
  summary: 'Delete position master',
  description:
    'Physically deletes a position master, blocked while staff are assigned (Y-01 FR-006)',
  tags: ['Positions'],
  parameters: pathParams,
  responses: [
    { status: 204, description: 'Position deleted (no content)' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Position in use (assigned staff)' },
    { status: 422, schema: ErrorResponseSchema, description: 'System-managed position' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

function parsePositionId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parsePositionId(rawId);
    const detail = id === null ? undefined : db.positions.getDetail(id);

    if (!detail) {
      return NextResponse.json(
        { error: '職位が見つかりません', code: 'E-STF-009' },
        { status: 404 },
      );
    }
    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    console.error('GET /crm/positions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch position detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parsePositionId(rawId);
    if (id === null) {
      return NextResponse.json(
        { error: '職位が見つかりません', code: 'E-STF-009' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validationResult = UpdatePositionBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.positions.update(id, validationResult.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('PATCH /crm/positions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parsePositionId(rawId);
    if (id === null) {
      return NextResponse.json(
        { error: '職位が見つかりません', code: 'E-STF-009' },
        { status: 404 },
      );
    }

    const result = db.positions.remove(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /crm/positions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
  }
}
