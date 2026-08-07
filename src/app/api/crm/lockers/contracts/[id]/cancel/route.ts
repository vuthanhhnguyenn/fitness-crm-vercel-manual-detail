import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  CancelLockerContractRequestSchema,
  CancelLockerContractResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/locker.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/lockers/contracts/{id}/cancel',
  summary: 'Cancel locker contract',
  description: 'Set locker contract as pending release with termination date',
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
    schema: CancelLockerContractRequestSchema,
    description: 'Termination date payload',
  },
  responses: [
    {
      status: 200,
      schema: CancelLockerContractResponseSchema,
      description: 'Locker contract cancelled',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
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

    const { id } = await params;
    const payload = await request.json();
    const validationResult = CancelLockerContractRequestSchema.safeParse(payload);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = db.lockerContracts.cancel(id, validationResult.data.termination_date);
    if (!result) {
      return NextResponse.json({ error: 'ロッカー契約が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'ロッカー契約を解約しました',
        contract_id: id,
        termination_date: result.termination_date,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/lockers/contracts/[id]/cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel locker contract' }, { status: 500 });
  }
}
