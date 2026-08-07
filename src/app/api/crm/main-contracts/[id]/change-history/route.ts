import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetMainContractChangeHistoryResponseSchema,
} from '@/app/api/_schemas/main-contract.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/main-contracts/{id}/change-history',
  summary: 'Get main contract change history',
  description: 'Get change history for a specific main contract master',
  tags: ['Main Contracts'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Main contract ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetMainContractChangeHistoryResponseSchema,
      description: 'Change history',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Verify the contract exists
    const detail = db.mainContracts.getById(id);
    if (!detail) {
      return NextResponse.json({ error: 'Main contract not found' }, { status: 404 });
    }
    const history = db.mainContracts.getChangeHistory(id);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error('GET /crm/main-contracts/[id]/change-history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
