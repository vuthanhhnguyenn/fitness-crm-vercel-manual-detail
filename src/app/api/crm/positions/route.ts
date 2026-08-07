import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type GetPositionsResponse,
  GetPositionsResponseSchema,
} from '@/app/api/_schemas/position.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/positions',
  summary: 'List staff positions',
  description: 'Returns the position master (職位マスター) for filters and dropdowns',
  tags: ['Staffs'],
  responses: [
    {
      status: 200,
      schema: GetPositionsResponseSchema,
      description: 'Position list',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET() {
  try {
    const response: GetPositionsResponse = {
      positions: db.positions.getList(),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}
