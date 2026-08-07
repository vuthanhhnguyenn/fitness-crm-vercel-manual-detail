import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  AddTrainingEquipmentExerciseLinksSchema,
  TrainingEquipmentExerciseLinksResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

function withExerciseToolName<T extends { exercise_tool_type: string }>(items: T[]) {
  return items.map((item) => ({
    ...item,
    exercise_tool_name:
      db.toolTypes.getByCode(item.exercise_tool_type)?.name ?? item.exercise_tool_type,
  }));
}

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/{equipmentId}/exercise-links',
  summary: 'Get linked exercises',
  tags: ['Training Equipment'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: [
    {
      status: 200,
      schema: TrainingEquipmentExerciseLinksResponseSchema,
      description: 'Exercise links',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/training-equipment/{equipmentId}/exercise-links',
  summary: 'Add linked exercises',
  tags: ['Training Equipment'],
  parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: { schema: AddTrainingEquipmentExerciseLinksSchema },
  responses: [
    {
      status: 200,
      schema: TrainingEquipmentExerciseLinksResponseSchema,
      description: 'Updated links',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/training-equipment/{equipmentId}/exercise-links',
  summary: 'Delete linked exercise',
  tags: ['Training Equipment'],
  parameters: [
    { name: 'equipmentId', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'exerciseId', in: 'query', required: true, schema: { type: 'string' } },
  ],
  responses: [
    { status: 204, description: 'Deleted' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> },
) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const { equipmentId } = await params;
  const equipment = db.trainingEquipment.getById(equipmentId);
  if (!equipment) {
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }
  const items = withExerciseToolName(db.trainingEquipment.getLinks(equipmentId));
  return NextResponse.json({ items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> },
) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const { equipmentId } = await params;
  const equipment = db.trainingEquipment.getById(equipmentId);
  if (!equipment) {
    return NextResponse.json({ error: 'Training equipment not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = AddTrainingEquipmentExerciseLinksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 },
    );
  }

  const { exercise_ids, force } = parsed.data;
  const mismatchedExerciseIds = exercise_ids.filter((exerciseId) => {
    const catalogItem = db.trainingEquipment.getExerciseCatalogItem(exerciseId);
    return catalogItem !== undefined && catalogItem.tool_type !== equipment.tool_type;
  });

  if (mismatchedExerciseIds.length > 0 && !force) {
    return NextResponse.json(
      {
        error: 'Tool type mismatch requires confirmation',
        details: mismatchedExerciseIds,
      },
      { status: 400 },
    );
  }

  const currentLinks = db.trainingEquipment.getLinks(equipmentId);
  const toAdd = exercise_ids
    .filter((exerciseId) => !currentLinks.some((link) => link.exercise_id === exerciseId))
    .map((exerciseId) => {
      const catalogItem = db.trainingEquipment.getExerciseCatalogItem(exerciseId);
      const exerciseToolType = catalogItem?.tool_type ?? equipment.tool_type;
      return {
        equipment_id: equipmentId,
        exercise_id: exerciseId,
        exercise_name: catalogItem?.name ?? `Exercise ${exerciseId}`,
        exercise_tool_type: exerciseToolType,
        exercise_tool_name: db.toolTypes.getByCode(exerciseToolType)?.name ?? exerciseToolType,
        difficulty: catalogItem?.difficulty ?? null,
        body_part: catalogItem?.body_part ?? null,
        created_at: new Date().toISOString(),
      };
    });
  db.trainingEquipment.addLinks(toAdd);

  db.trainingEquipment.refreshLinkCount(equipmentId);
  const items = withExerciseToolName(db.trainingEquipment.getLinks(equipmentId));
  return NextResponse.json({ items });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> },
) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const { equipmentId } = await params;
  const exerciseId = request.nextUrl.searchParams.get('exerciseId');
  if (!exerciseId) {
    return NextResponse.json({ error: 'exerciseId is required' }, { status: 400 });
  }

  const deleted = db.trainingEquipment.deleteLink(equipmentId, exerciseId);
  if (!deleted) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }
  db.trainingEquipment.refreshLinkCount(equipmentId);
  return new NextResponse(null, { status: 204 });
}
