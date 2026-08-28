import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  CreateTrainingEquipmentRequestSchema,
  type ListTrainingEquipmentQuery,
  ListTrainingEquipmentQuerySchema,
  type ListTrainingEquipmentResponse,
  ListTrainingEquipmentResponseSchema,
  TrainingEquipmentDetailSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import {
  applyFilters,
  applySort,
  applyStoreScope,
  toDetail,
  toListItem,
} from './_lib/training-equipment.mapper';
import { assertCanWrite, resolveStoreScope } from './_lib/training-equipment.scope';

registerRoute({
  method: 'get',
  path: '/crm/training-equipment',
  summary: 'List & search training equipment',
  description:
    'E-03 FR-001 / FR-002. Page-based pagination. `discarded` rows are hidden unless `includeDiscarded=true` or `installationStatus=discarded` is passed. Default sort is 器具種別（mst_tools.sortOrder）then 機材名昇順.',
  tags: ['Training Equipment Management'],
  query: ListTrainingEquipmentQuerySchema,
  responses: [
    {
      status: 200,
      schema: ListTrainingEquipmentResponseSchema,
      description: 'Training equipment list',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/training-equipment',
  summary: 'Register training equipment',
  description: 'E-03 FR-003 機材新規登録。機材IDはシステムが自動採番する',
  tags: ['Training Equipment Management'],
  requestBody: { schema: CreateTrainingEquipmentRequestSchema },
  responses: [
    { status: 201, schema: TrainingEquipmentDetailSchema, description: 'Created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
  ],
});

export async function GET(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const parsed = ListTrainingEquipmentQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: '検索条件に誤りがあります',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query: ListTrainingEquipmentQuery = parsed.data;
  const storeScope = resolveStoreScope(authResult.user, query.storeId);
  if (!storeScope.ok) {
    return NextResponse.json({ error: storeScope.error }, { status: storeScope.status });
  }

  const scoped = applyStoreScope(db.trainingEquipment.getAll(), storeScope.scope);
  const filtered = applySort(applyFilters(scoped, query), query.sort, query.order);

  const totalItems = filtered.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit);
  const start = (query.page - 1) * query.limit;

  // totalAllItems = the count after clearing the conditions: optional filters reset to their
  // defaults while the store scope stays applied. When the caller's filter *does*
  // surface discarded rows, they are counted too — otherwise the filtered count
  // could exceed the total and the banner would read "5 of 3 items".
  const countsDiscarded = query.includeDiscarded || query.installationStatus === 'discarded';
  const totalAllItems = query.includeTotalAll
    ? applyFilters(scoped, { includeDiscarded: countsDiscarded }).length
    : null;

  const response: ListTrainingEquipmentResponse = {
    items: filtered.slice(start, start + query.limit).map(toListItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages,
      totalAllItems,
    },
  };
  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const parsed = CreateTrainingEquipmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: '入力内容に誤りがあります',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const permission = assertCanWrite(authResult.user);
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }

  const tool = db.toolTypes.getById(parsed.data.mstToolId);
  if (!tool || tool.code === 'none') {
    return NextResponse.json({ error: '器具種別が正しくありません' }, { status: 400 });
  }

  const storeScope = resolveStoreScope(authResult.user, parsed.data.storeId);
  if (!storeScope.ok) {
    return NextResponse.json({ error: storeScope.error }, { status: storeScope.status });
  }

  const store = db.stores.getList().find((row) => row.id === parsed.data.storeId);
  if (!store) {
    return NextResponse.json({ error: '対象の店舗が見つかりません' }, { status: 400 });
  }

  const created = db.trainingEquipment.create({
    storeId: parsed.data.storeId,
    storeName: store.name,
    name: parsed.data.name,
    mstToolId: parsed.data.mstToolId,
    quantity: parsed.data.quantity,
    locationInGym: parsed.data.locationInGym ?? null,
    manufacturer: parsed.data.manufacturer ?? null,
    model: parsed.data.model ?? null,
    installedOn: parsed.data.installedOn ?? null,
    installationStatus: parsed.data.installationStatus,
    note: parsed.data.note ?? null,
    statusChangedByName: authResult.user.name,
  });

  return NextResponse.json(toDetail(created), { status: 201 });
}
