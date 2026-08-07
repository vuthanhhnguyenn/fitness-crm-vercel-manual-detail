import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  BulkUpdateEquipmentStatusRequestSchema,
  BulkUpdateEquipmentStatusResponseSchema,
} from '@/app/api/_schemas/equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/equipment/bulk-status',
  summary: 'Bulk update equipment status',
  description: 'Update the operational status of multiple connected equipment records',
  tags: ['Equipment'],
  requestBody: { schema: BulkUpdateEquipmentStatusRequestSchema },
  responses: [
    {
      status: 200,
      schema: BulkUpdateEquipmentStatusResponseSchema,
      description: 'Bulk status update result',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = BulkUpdateEquipmentStatusRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { ids, status } = validation.data;
    const results = db.equipment.bulkUpdateStatus(ids, status);
    const updated_count = results.filter((result) => result.success).length;

    return NextResponse.json({
      success: results.every((result) => result.success),
      updated_count,
      results,
    });
  } catch (error) {
    console.error('Error bulk updating equipment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
