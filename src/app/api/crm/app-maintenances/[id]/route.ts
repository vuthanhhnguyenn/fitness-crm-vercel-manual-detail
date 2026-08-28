import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { toAppMaintenanceDetailResponse } from '@/app/api/_mock-db/tables/app-maintenance.table';
import {
  AppMaintenanceDetailResponseSchema,
  DeleteAppMaintenanceResponseSchema,
  UpdateAppMaintenanceBodySchema,
  UpdateAppMaintenanceResponseSchema,
} from '@/app/api/_schemas/app-maintenance.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const NOT_FOUND_MESSAGE = '該当するメンテナンス情報が見つかりません。';

registerRoute({
  method: 'get',
  path: '/crm/app-maintenances/{id}',
  summary: 'Get app maintenance window detail',
  description: 'Fetch a single app maintenance window for edit pre-fill',
  tags: ['App Maintenance'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'App maintenance ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: AppMaintenanceDetailResponseSchema,
      description: 'App maintenance detail',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    // View (list/detail) allowed for all roles except Trainer (権限マトリクス, 260713_v2)
    if (authResult.user.role === 'Trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const row = db.appMaintenances.getById(id);
    if (!row) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(toAppMaintenanceDetailResponse(row));
  } catch (error) {
    console.error('GET /crm/app-maintenances/[id] error:', error);
    return NextResponse.json(
      { error: 'アプリメンテナンス情報の取得に失敗しました' },
      { status: 500 },
    );
  }
}

registerRoute({
  method: 'patch',
  path: '/crm/app-maintenances/{id}',
  summary: 'Update an app maintenance window',
  description: 'Partially update an app maintenance window (System/Headquarter roles only)',
  tags: ['App Maintenance'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'App maintenance ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateAppMaintenanceBodySchema,
    description: 'App maintenance update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateAppMaintenanceResponseSchema,
      description: 'App maintenance updated',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation error' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'Locked or period conflict' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateAppMaintenanceBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 },
      );
    }

    const result = db.appMaintenances.update(id, validationResult.data, authResult.user.id);

    if (result === 'not_found') {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }
    if (result === 'start_locked') {
      return NextResponse.json(
        { error: 'メンテナンス中のため開始日時は変更できません。' },
        { status: 409 },
      );
    }
    if (result === 'invalid_period') {
      return NextResponse.json(
        { error: '終了日時は開始日時より後の日時を入力してください。' },
        { status: 400 },
      );
    }
    if (result === 'period_conflict') {
      return NextResponse.json(
        { error: '登録しようとしている期間は既存のメンテナンス期間と重複しています。' },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: 'メンテナンス設定の変更を保存しました',
      appMaintenance: toAppMaintenanceDetailResponse(result),
    });
  } catch (error) {
    console.error('PATCH /crm/app-maintenances/[id] error:', error);
    return NextResponse.json({ error: 'メンテナンス設定の更新に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'delete',
  path: '/crm/app-maintenances/{id}',
  summary: 'Delete an app maintenance window',
  description: 'Delete an app maintenance window by id (System/Headquarter roles only)',
  tags: ['App Maintenance'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'App maintenance ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: DeleteAppMaintenanceResponseSchema,
      description: 'App maintenance deleted',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'In-progress lock' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = getAuthUserFromRequest(_request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const result = db.appMaintenances.delete(id);

    if (result === 'not_found') {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }
    if (result === 'in_progress_locked') {
      return NextResponse.json(
        { error: 'メンテナンス実施中のため削除できません。' },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: 'メンテナンス情報を削除しました', id });
  } catch (error) {
    console.error('DELETE /crm/app-maintenances/[id] error:', error);
    return NextResponse.json({ error: 'メンテナンス情報の削除に失敗しました' }, { status: 500 });
  }
}
