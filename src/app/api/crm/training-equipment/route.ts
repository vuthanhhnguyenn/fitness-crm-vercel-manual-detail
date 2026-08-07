import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type GetTrainingEquipmentQuery,
  GetTrainingEquipmentQuerySchema,
  type GetTrainingEquipmentResponse,
  GetTrainingEquipmentResponseSchema,
  type LocationInGym,
  type TrainingEquipmentItem,
  UpsertTrainingEquipmentSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment',
  summary: 'Get training equipment list',
  description: 'Get paginated training equipment list with filtering and sorting',
  tags: ['Training Equipment'],
  query: GetTrainingEquipmentQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetTrainingEquipmentResponseSchema,
      description: 'Training equipment list',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
  ],
});

const LOCATION_IN_GYM_LABELS: Record<LocationInGym, string> = {
  aerobic_area: '有酸素エリア',
  machine_area: 'マシンエリア',
  free_weight_area: 'フリーウェイトエリア',
  stretch_area: 'ストレッチエリア',
};

registerRoute({
  method: 'post',
  path: '/crm/training-equipment',
  summary: 'Create training equipment',
  description: 'Create a training equipment record',
  tags: ['Training Equipment'],
  requestBody: { schema: UpsertTrainingEquipmentSchema },
  responses: [
    {
      status: 201,
      schema: GetTrainingEquipmentResponseSchema.shape.items.element,
      description: 'Created',
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
  const parsed = GetTrainingEquipmentQuerySchema.safeParse(queryObj);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query: GetTrainingEquipmentQuery = parsed.data;
  let items = db.trainingEquipment.getAll().filter((item) => !item.is_deleted);

  if (query.store_id && query.store_id !== 'all') {
    items = items.filter((item) => item.store_id === query.store_id);
  }
  if (query.keyword) {
    const needle = query.keyword.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        (item.installation_area ?? '').toLowerCase().includes(needle) ||
        (item.installation_area
          ? LOCATION_IN_GYM_LABELS[item.installation_area].toLowerCase().includes(needle)
          : false),
    );
  }
  if (query.tool_type) {
    items = items.filter((item) => item.tool_type === query.tool_type);
  }
  if (query.status === 'exclude_discarded') {
    items = items.filter((item) => item.status !== 'discarded');
  } else if (query.status !== 'all') {
    items = items.filter((item) => item.status === query.status);
  }

  // FE does not force initial sort; default ordering is API/mock responsibility.
  const sortBy = query.sort_by ?? 'tool_type';
  const sortOrder = query.sort_order ?? 'asc';
  items = [...items].sort((left, right) => {
    const l = String(left[sortBy as keyof TrainingEquipmentItem] ?? '');
    const r = String(right[sortBy as keyof TrainingEquipmentItem] ?? '');
    const cmp = l.localeCompare(r, 'ja');
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const total = items.length;
  const total_pages = total === 0 ? 0 : Math.ceil(total / query.page_size);
  const start = (query.page - 1) * query.page_size;
  const pagedItems = items.slice(start, start + query.page_size).map((item) => ({
    ...item,
    tool_name: db.toolTypes.getByCode(item.tool_type)?.name ?? item.tool_type,
  }));

  const response: GetTrainingEquipmentResponse = {
    items: pagedItems,
    total,
    page: query.page,
    page_size: query.page_size,
    total_pages,
  };
  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const parsed = UpsertTrainingEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 },
    );
  }

  const item: TrainingEquipmentItem = db.trainingEquipment.create({
    ...parsed.data,
    store_id: parsed.data.store_id,
    store_name: parsed.data.store_name,
    installation_area: parsed.data.installation_area ?? null,
    manufacturer: parsed.data.manufacturer ?? null,
    model_number: parsed.data.model_number ?? null,
    installed_on: parsed.data.installed_on ?? null,
    notes: parsed.data.notes ?? null,
    last_updated_by: authResult.user.name,
    status: parsed.data.status,
    quantity: parsed.data.quantity,
    tool_type: parsed.data.tool_type,
    name: parsed.data.name,
  });

  return NextResponse.json(item, { status: 201 });
}
