import { NextRequest, NextResponse } from 'next/server';

import { type AuthenticatedUser, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { positionNameById } from '@/app/api/_mock-db/seeds/position.seed';
import {
  DeleteStaffRequestSchema,
  DeleteStaffResponseSchema,
  ErrorResponseSchema,
  GetStaffDetailResponseSchema,
  type StaffDetail,
  type StaffRole,
  UpdateStaffRequestSchema,
  UpdateStaffResponseSchema,
} from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const ROLE_LABEL_JA: Record<StaffRole, string> = {
  system: 'システム',
  headquarter: '本部',
  manager: 'マネージャー',
  staff: 'スタッフ',
  trainer: 'トレーナー',
  observer: '閲覧のみ',
};

function isHeadquarters(caller: AuthenticatedUser): boolean {
  return caller.role === 'System' || caller.role === 'Headquarter';
}

function isSelf(caller: AuthenticatedUser, target: StaffDetail): boolean {
  return Boolean(caller.staff_id) && caller.staff_id === target.staff_id;
}

function isManagerOfStore(caller: AuthenticatedUser, target: StaffDetail): boolean {
  return (
    caller.role === 'Manager' &&
    target.staff_linkage.type === 'direct_store' &&
    !!target.staff_linkage.store_id &&
    (caller.managed_store_ids ?? []).includes(target.staff_linkage.store_id)
  );
}

/** Edit access (PATCH, FR-013): Manager may only edit "Staff"-role accounts in a managed store. */
function isManagerOfTarget(caller: AuthenticatedUser, target: StaffDetail): boolean {
  return isManagerOfStore(caller, target) && target.role === 'staff';
}

/**
 * Read access (GET, FR-004): headquarters/system, the target themself, or a Manager whose
 * managed stores include the target's store — role-agnostic, unlike edit access.
 */
function canRead(caller: AuthenticatedUser, target: StaffDetail): boolean {
  return isHeadquarters(caller) || isSelf(caller, target) || isManagerOfStore(caller, target);
}

function staffLinkageLabel(linkage: StaffDetail['staff_linkage']): string {
  if (linkage.type === 'direct_store') return linkage.store_name ?? linkage.store_id ?? '未設定';
  return linkage.fc_company_name ?? linkage.fc_company_id ?? '未設定';
}

function operatorInfo(caller: AuthenticatedUser): { name: string; position: string } {
  const user = db.users.getById(caller.id);
  return { name: caller.name, position: user?.position ?? '' };
}

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
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - caller lacks access to this staff account',
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const staff = db.staffs.getDetailById(id);

    // System-role accounts are 開発・運用チーム専用 (dev/ops only) and are never navigable
    // from the staff directory — treat them the same as a non-existent record.
    if (!staff || staff.role === 'system') {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    if (!canRead(authResult.user, staff)) {
      return NextResponse.json(
        { error: 'このスタッフ情報を閲覧する権限がありません' },
        { status: 403 },
      );
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
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - caller lacks access to edit this field/staff',
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
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const caller = authResult.user;

    const { id } = await params;
    const body = await request.json();

    const validationResult = UpdateStaffRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const patch = validationResult.data;

    const existing = db.staffs.getDetailById(id);
    if (!existing) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    const hq = isHeadquarters(caller);
    const managerOfTarget = isManagerOfTarget(caller, existing);
    const self = isSelf(caller, existing);

    if (patch.role !== undefined && patch.role !== existing.role && !hq) {
      return NextResponse.json({ error: 'ロール変更は本部権限が必要です' }, { status: 403 });
    }

    if (!hq && !managerOfTarget && !self) {
      return NextResponse.json(
        { error: 'このスタッフを編集する権限がありません' },
        { status: 403 },
      );
    }

    // Account owner (not HQ, not managing Manager) may only edit name/email/note.
    if (self && !hq && !managerOfTarget) {
      const restrictedFields: Array<keyof typeof patch> = [
        'position_id',
        'role',
        'staff_linkage',
        'status',
        'permission_settings',
        'editable_scopes',
      ];
      if (restrictedFields.some((field) => patch[field] !== undefined)) {
        return NextResponse.json(
          { error: '氏名・メールアドレス・備考以外の項目は編集できません' },
          { status: 403 },
        );
      }
    }

    const changeParts: string[] = [];
    if (patch.role !== undefined && patch.role !== existing.role) {
      changeParts.push(
        `ロール変更: ${ROLE_LABEL_JA[existing.role]} → ${ROLE_LABEL_JA[patch.role]}`,
      );
    }
    if (patch.position_id !== undefined && patch.position_id !== existing.position_id) {
      changeParts.push(
        `職位変更: ${positionNameById(existing.position_id)} → ${positionNameById(patch.position_id)}`,
      );
    }

    const updated = db.staffs.updateDetail(id, patch);
    if (!updated) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    if (
      patch.staff_linkage !== undefined &&
      JSON.stringify(updated.staff_linkage) !== JSON.stringify(existing.staff_linkage)
    ) {
      changeParts.push(
        `所属変更: ${staffLinkageLabel(existing.staff_linkage)} → ${staffLinkageLabel(updated.staff_linkage)}`,
      );
    }

    if (changeParts.length > 0) {
      db.staffs.recordPermissionChange(id, changeParts.join('、'), operatorInfo(caller));
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
  description: 'Soft-delete a staff member by ID (headquarters/system only)',
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
      status: 403,
      schema: ErrorResponseSchema,
      description: 'Forbidden - headquarters/system only',
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
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (!isHeadquarters(authResult.user)) {
      return NextResponse.json({ error: 'スタッフの削除は本部権限が必要です' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validationResult = DeleteStaffRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const deleted = db.staffs.softDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: 'スタッフを削除しました' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'スタッフの削除に失敗しました' }, { status: 500 });
  }
}
