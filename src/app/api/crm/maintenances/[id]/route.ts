import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { toCrmMaintenanceDetailResponse } from '@/app/api/_mock-db/tables/crm-maintenance.table';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  CrmMaintenanceDetailResponseSchema,
  DeleteCrmMaintenanceResponseSchema,
  UpdateCrmMaintenanceBodySchema,
  UpdateCrmMaintenanceResponseSchema,
} from '@/app/api/_schemas/crm-maintenance.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const NOT_FOUND_MESSAGE = '該当するメンテナンス情報が見つかりません。';
const UNKNOWN_STAFF_MESSAGE = '該当するユーザーが見つかりません';
const PERIOD_CONFLICT_MESSAGE =
  '登録しようとしている期間は既存のメンテナンス期間と重複しています。';

registerRoute({
  method: 'get',
  path: '/crm/maintenances/{id}',
  summary: 'Get CRM maintenance window detail',
  description: 'Fetch a single CRM maintenance window with its allowed-user list',
  tags: ['CRM Maintenance'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'CRM maintenance ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: CrmMaintenanceDetailResponseSchema,
      description: 'CRM maintenance detail',
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
    if (authResult.user.role !== 'System' && authResult.user.role !== 'Headquarter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const row = db.crmMaintenances.getById(id);
    if (!row) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(
      toCrmMaintenanceDetailResponse(row, db.crmMaintenances.getAllowedUsers(row.id)),
    );
  } catch (error) {
    console.error('GET /crm/maintenances/[id] error:', error);
    return NextResponse.json({ error: 'CRMメンテナンス情報の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'patch',
  path: '/crm/maintenances/{id}',
  summary: 'Update a CRM maintenance window',
  description: 'Partially update a CRM maintenance window (System role only)',
  tags: ['CRM Maintenance'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'CRM maintenance ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateCrmMaintenanceBodySchema,
    description: 'CRM maintenance update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateCrmMaintenanceResponseSchema,
      description: 'CRM maintenance updated',
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
    if (authResult.user.role !== 'System') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateCrmMaintenanceBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map((issue) => issue.message).join(', ') },
        { status: 400 },
      );
    }

    const result = db.crmMaintenances.update(id, validationResult.data, authResult.user.id);

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
      return NextResponse.json({ error: PERIOD_CONFLICT_MESSAGE }, { status: 409 });
    }
    if (result === 'unknown_staff_id') {
      return NextResponse.json({ error: UNKNOWN_STAFF_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({
      message: 'CRMメンテナンスの変更を保存しました',
      crmMaintenance: toCrmMaintenanceDetailResponse(
        result,
        db.crmMaintenances.getAllowedUsers(result.id),
      ),
    });
  } catch (error) {
    console.error('PATCH /crm/maintenances/[id] error:', error);
    return NextResponse.json({ error: 'CRMメンテナンスの更新に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'delete',
  path: '/crm/maintenances/{id}',
  summary: 'Delete a CRM maintenance window',
  description: 'Delete a CRM maintenance window and its allowed-user list (System role only)',
  tags: ['CRM Maintenance'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'CRM maintenance ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: DeleteCrmMaintenanceResponseSchema,
      description: 'CRM maintenance deleted',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: ErrorResponseSchema, description: 'In-progress lock' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const result = db.crmMaintenances.delete(id);

    if (result === 'not_found') {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }
    if (result === 'in_progress_locked') {
      return NextResponse.json(
        { error: 'メンテナンス実施中のため削除できません。' },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: 'CRMメンテナンス情報を削除しました', id });
  } catch (error) {
    console.error('DELETE /crm/maintenances/[id] error:', error);
    return NextResponse.json({ error: 'CRMメンテナンス情報の削除に失敗しました' }, { status: 500 });
  }
}
