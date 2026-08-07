import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetLockerContractDetailResponseSchema,
  UpdateLockerContractRequestSchema,
  type UpdateLockerContractResponse,
  UpdateLockerContractResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lockers/contracts/{id}',
  summary: 'Get locker contract detail',
  description: 'Get detailed information about a specific locker contract',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Locker contract internal id',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetLockerContractDetailResponseSchema,
      description: 'Locker contract detail',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'patch',
  path: '/crm/lockers/contracts/{id}',
  summary: 'Update locker contract',
  description: 'Update an existing locker contract',
  tags: ['Lockers'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Locker contract internal id',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateLockerContractRequestSchema,
    description: 'Locker contract update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateLockerContractResponseSchema,
      description: 'Locker contract updated successfully',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Conflict' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(_request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const contract = db.lockerContracts.getById(id);
    if (!contract) {
      return NextResponse.json({ error: 'ロッカー契約が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ contract }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/lockers/contracts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch locker contract detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateLockerContractRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.lockerContracts.update(id, validationResult.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const response: UpdateLockerContractResponse = {
      message: 'ロッカー契約を更新しました',
      contract: result.contract,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('PATCH /crm/lockers/contracts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update locker contract' }, { status: 500 });
  }
}
