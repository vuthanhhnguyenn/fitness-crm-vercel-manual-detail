import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeleteStaffRequestSchema,
  DeleteStaffResponseSchema,
  ErrorResponseSchema,
  GetStaffDetailResponseSchema,
  UpdateStaffRequestSchema,
  UpdateStaffResponseSchema,
} from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// ─── GET /crm/staffs/{id} ───────────────────────────────────────────────────

registerRoute({
  method: 'get',
  path: '/crm/staffs/{id}',
  summary: 'Get staff detail',
  description: 'Get full staff detail by ID (スタッフ編集画面用)',
  tags: ['Staffs'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Staff ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetStaffDetailResponseSchema,
      description: 'Staff detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Staff not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const staff = db.staffs.getDetailById(id);

    if (!staff) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching staff detail:', error);
    return NextResponse.json({ error: 'スタッフ情報の取得に失敗しました' }, { status: 500 });
  }
}

// ─── PATCH /crm/staffs/{id} ──────────────────────────────────────────────────

registerRoute({
  method: 'patch',
  path: '/crm/staffs/{id}',
  summary: 'Update staff',
  description: 'Partially update staff information (スタッフ編集)',
  tags: ['Staffs'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Staff ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateStaffRequestSchema,
    description: 'Staff update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateStaffResponseSchema,
      description: 'Staff updated successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid request body',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Staff not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = UpdateStaffRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.staffs.updateDetail(id, validationResult.data);

    if (!updated) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'スタッフ情報を更新しました',
      staff: updated,
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'スタッフ情報の更新に失敗しました' }, { status: 500 });
  }
}

// ─── DELETE /crm/staffs/{id} ─────────────────────────────────────────────────

registerRoute({
  method: 'delete',
  path: '/crm/staffs/{id}',
  summary: 'Delete a staff member',
  description: 'Delete a staff member by ID',
  tags: ['Staffs'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Staff ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: DeleteStaffRequestSchema,
    description: 'Staff delete payload',
  },
  responses: [
    {
      status: 200,
      schema: DeleteStaffResponseSchema,
      description: 'Staff deleted successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid request body',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Staff not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validationResult = DeleteStaffRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const deleted = db.staffs.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: 'スタッフを削除しました' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'スタッフの削除に失敗しました' }, { status: 500 });
  }
}
