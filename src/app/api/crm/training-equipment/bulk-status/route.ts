import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  BulkUpdateTrainingEquipmentStatusRequestSchema,
  BulkUpdateTrainingEquipmentStatusResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/training-equipment/bulk-status',
  summary: 'Bulk update training equipment status',
  description: 'Update the installation status of multiple training equipment records',
  tags: ['Training Equipment'],
  requestBody: { schema: BulkUpdateTrainingEquipmentStatusRequestSchema },
  responses: [
    {
      status: 200,
      schema: BulkUpdateTrainingEquipmentStatusResponseSchema,
      description: 'Bulk status update result',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validation = BulkUpdateTrainingEquipmentStatusRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { ids, next_status, reason } = validation.data;
    const results = db.trainingEquipment.bulkUpdateStatus(
      ids,
      next_status,
      authResult.user.name,
      reason.trim(),
    );
    const updated_count = results.filter((result) => result.success).length;

    return NextResponse.json({
      success: results.every((result) => result.success),
      updated_count,
      results,
    });
  } catch (error) {
    console.error('Error bulk updating training equipment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
