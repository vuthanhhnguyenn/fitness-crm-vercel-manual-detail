import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetEquipmentSummaryResponse,
  GetEquipmentSummaryResponseSchema,
} from '@/app/api/_schemas/equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/equipment/summary',
  summary: 'Get store equipment summary',
  description: 'Aggregate counts for the 店舗機器管理 tabs (connected equipment and controllers)',
  tags: ['Equipment'],
  responses: [
    {
      status: 200,
      schema: GetEquipmentSummaryResponseSchema,
      description: 'Store equipment summary counts',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const summary: GetEquipmentSummaryResponse = {
      equipment_count: db.equipment.getAll().length,
      controllers_count: db.controllers.getAll().length,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching equipment summary:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment summary' }, { status: 500 });
  }
}
