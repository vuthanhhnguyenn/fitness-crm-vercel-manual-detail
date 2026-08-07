import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type DeleteBrandFeeGroupResponse,
  DeleteBrandFeeGroupResponseSchema,
  UpdateBrandFeeGroupRequestSchema,
  type UpdateBrandFeeGroupResponse,
  UpdateBrandFeeGroupResponseSchema,
} from '@/app/api/_schemas/brand.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/brands/{id}/fees/{subBrandCode}',
  summary: 'Update Y-07 brand fee group',
  description: 'ブランド詳細画面の費用タブでサブブランド単位の費用設定を更新する。',
  tags: ['Brands'],
  requestBody: {
    schema: UpdateBrandFeeGroupRequestSchema,
    description: 'Brand fee group update payload',
  },
  responses: [
    {
      status: 200,
      schema: UpdateBrandFeeGroupResponseSchema,
      description: 'Updated fee group',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

registerRoute({
  method: 'delete',
  path: '/crm/brands/{id}/fees/{subBrandCode}',
  summary: 'Delete Y-07 brand fee group',
  description: 'ブランド詳細画面の費用タブでサブブランド単位の費用マスタを削除する。',
  tags: ['Brands'],
  responses: [
    {
      status: 200,
      schema: DeleteBrandFeeGroupResponseSchema,
      description: 'Deleted fee group',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; subBrandCode: string }> },
) {
  try {
    const { id, subBrandCode } = await context.params;
    const brand = db.brands.getByCode(id);
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const feeGroup = db.brands.getFeeGroup(id, subBrandCode);
    if (!feeGroup) {
      return NextResponse.json({ error: 'Fee group not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = UpdateBrandFeeGroupRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const payload = parsedBody.data;

    const expectedCodes = new Set(feeGroup.fee_items.map((item) => item.item_code));
    const payloadCodes = new Set(payload.fee_items.map((item) => item.item_code));
    const hasDifferentLength = payload.fee_items.length !== feeGroup.fee_items.length;
    const hasDuplicateCodes = payloadCodes.size !== payload.fee_items.length;
    const hasUnknownOrMissingCodes =
      payloadCodes.size !== expectedCodes.size ||
      [...payloadCodes].some((itemCode) => !expectedCodes.has(itemCode));

    if (hasDifferentLength || hasDuplicateCodes || hasUnknownOrMissingCodes) {
      return NextResponse.json(
        { error: 'Fee items do not match the target group' },
        { status: 400 },
      );
    }

    const updatedGroup = db.brands.updateFeeGroup(id, subBrandCode, payload);
    if (!updatedGroup) {
      return NextResponse.json({ error: 'Fee group not found' }, { status: 404 });
    }

    const response: UpdateBrandFeeGroupResponse = {
      message: '費用設定を保存しました',
      fee_group: updatedGroup,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating brand fee group:', error);
    return NextResponse.json({ error: 'Failed to update brand fee group' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; subBrandCode: string }> },
) {
  try {
    const { id, subBrandCode } = await context.params;
    const brand = db.brands.getByCode(id);
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const deleted = db.brands.deleteFeeGroup(id, subBrandCode);
    if (!deleted) {
      return NextResponse.json({ error: 'Fee group not found' }, { status: 404 });
    }

    const response: DeleteBrandFeeGroupResponse = {
      message: '費用マスタを削除しました',
      deleted_sub_brand_code: subBrandCode,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting brand fee group:', error);
    return NextResponse.json({ error: 'Failed to delete brand fee group' }, { status: 500 });
  }
}
