import { NextResponse } from 'next/server';

import { DEFAULT_MEMBER_MAIN_CONTRACT, db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetMemberMainContractLabelsResponse,
  GetMemberMainContractLabelsResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/meta/main-contract-labels',
  summary: 'Member form main contract labels',
  description:
    'Returns ordered main contract display names for member create/edit (mock DB master).',
  tags: ['Members'],
  responses: [
    {
      status: 200,
      schema: GetMemberMainContractLabelsResponseSchema,
      description: 'Label list',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET() {
  try {
    const raw = {
      labels: db.mainContracts.getList().map((contract) => contract.name),
      default_label: DEFAULT_MEMBER_MAIN_CONTRACT,
    };

    const parsed = GetMemberMainContractLabelsResponseSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('Member main contract labels validation failed:', parsed.error.flatten());
      return NextResponse.json({ error: 'Invalid labels payload' }, { status: 500 });
    }

    const response: GetMemberMainContractLabelsResponse = parsed.data;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching member main contract labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}
