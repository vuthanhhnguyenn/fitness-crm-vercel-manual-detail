import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetMainContractResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/contracts/main-contract',
  summary: 'Get member main contract',
  description: 'Get main contract information for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetMainContractResponseSchema,
      description: 'Main contract information',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member or contract not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const contracts = db.contracts.getByMemberId(id);
    if (!contracts?.main_contract) {
      return NextResponse.json({ error: 'Main contract not found' }, { status: 404 });
    }

    return NextResponse.json(contracts.main_contract);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch main contract' }, { status: 500 });
  }
}
