import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetFranchiseCompanyHistoryResponse,
  GetFranchiseCompanyHistoryResponseSchema,
} from '@/app/api/_schemas/franchise-company.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/franchise-companies/{id}/history',
  summary: 'Get franchise company history',
  description: 'Get history records for a single FC company.',
  tags: ['FranchiseCompanies'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'FC company ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 200, schema: GetFranchiseCompanyHistoryResponseSchema, description: 'History' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const company = db.franchiseCompanies.getById(id);

    if (!company) {
      return NextResponse.json({ error: 'Franchise company not found' }, { status: 404 });
    }

    const response: GetFranchiseCompanyHistoryResponse = {
      history: db.franchiseCompanies.getHistory(id),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET /crm/franchise-companies/[id]/history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch franchise company history' },
      { status: 500 },
    );
  }
}
