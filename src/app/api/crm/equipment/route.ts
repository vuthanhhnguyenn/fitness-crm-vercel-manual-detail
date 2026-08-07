import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  type CreateEquipmentResponse,
  CreateEquipmentResponseSchema,
  type GetEquipmentQuery,
  GetEquipmentQuerySchema,
  type GetEquipmentResponse,
  GetEquipmentResponseSchema,
  UpsertEquipmentRequestSchema,
} from '@/app/api/_schemas/equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/equipment',
  summary: 'Get equipment list',
  description: 'Get paginated list of connected equipment with filtering and sorting',
  tags: ['Equipment'],
  query: GetEquipmentQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetEquipmentResponseSchema,
      description: 'List of connected equipment',
    },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/equipment',
  summary: 'Create connected equipment',
  description: 'Register a new connected equipment record (FR-003)',
  tags: ['Equipment'],
  requestBody: {
    schema: UpsertEquipmentRequestSchema,
    description: 'Connected equipment create payload',
  },
  responses: [
    {
      status: 201,
      schema: CreateEquipmentResponseSchema,
      description: 'Connected equipment created',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

type EquipmentRecord = ReturnType<typeof db.equipment.getAll>[number];

const EQUIPMENT_SORTERS: Record<
  GetEquipmentQuery['sort_by'],
  (left: EquipmentRecord, right: EquipmentRecord) => number
> = {
  id: (left, right) => left.id.localeCompare(right.id),
  name: (left, right) => left.name.localeCompare(right.name, 'ja'),
  controller_number: (left, right) => left.controller_number - right.controller_number,
  qr_code_id: (left, right) => (left.qr_code_id ?? '').localeCompare(right.qr_code_id ?? ''),
  equipment_type: (left, right) => left.equipment_type.localeCompare(right.equipment_type),
  status: (left, right) => left.status.localeCompare(right.status),
  updated_at: (left, right) => left.updated_at.localeCompare(right.updated_at),
};

export async function GET(request: NextRequest) {
  try {
    const queryObj: Record<string, string | undefined> = {};

    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetEquipmentQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const query: GetEquipmentQuery = validationResult.data;
    const { equipment_type, limit, page, search, sort_by, sort_order, status, store_id } = query;

    let items = db.equipment.getAll();

    if (search) {
      const normalized = search.toLowerCase();
      items = items.filter((item) =>
        [item.name, item.serial_number, item.install_location].some((value) =>
          value.toLowerCase().includes(normalized),
        ),
      );
    }

    if (store_id && store_id !== 'all') {
      items = items.filter((item) => item.store_id === store_id);
    }

    if (equipment_type) {
      items = items.filter((item) => item.equipment_type === equipment_type);
    }

    if (status) {
      items = items.filter((item) => item.status === status);
    }

    items = [...items].sort((left, right) => {
      const comparison = EQUIPMENT_SORTERS[sort_by](left, right);
      return sort_order === 'desc' ? -comparison : comparison;
    });

    const total = items.length;
    const total_pages = total === 0 ? 0 : Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    const response: GetEquipmentResponse = {
      items: items.slice(startIndex, startIndex + limit),
      total,
      page,
      limit,
      total_pages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const validationResult = UpsertEquipmentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    const equipment = db.equipment.create(validationResult.data);
    const response: CreateEquipmentResponse = { equipment };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}
