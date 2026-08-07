import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  GetTrainingEquipmentExercisesQuerySchema,
  TrainingEquipmentExercisesResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/exercises',
  summary: 'Get training equipment exercise catalog',
  tags: ['Training Equipment'],
  query: GetTrainingEquipmentExercisesQuerySchema,
  responses: [
    {
      status: 200,
      schema: TrainingEquipmentExercisesResponseSchema,
      description: 'Exercise catalog',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
  ],
});

export async function GET(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const queryObj: Record<string, string | undefined> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });

  const parsed = GetTrainingEquipmentExercisesQuerySchema.safeParse(queryObj);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query = parsed.data;
  let items = db.trainingEquipment.listExerciseCatalog();

  if (query.tool_type) {
    items = items.filter((item) => item.tool_type === query.tool_type);
  }
  if (query.keyword) {
    const needle = query.keyword.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(needle));
  }

  return NextResponse.json({ items });
}
