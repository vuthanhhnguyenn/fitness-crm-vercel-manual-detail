import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type DisableBrandFeeGroupResponse,
  DisableBrandFeeGroupResponseSchema,
} from '@/app/api/_schemas/brand.schema';
import { ErrorResponseSchema } from '@/app/api/_schemas/staff.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'patch',
  path: '/crm/brands/{id}/fees/{subBrandCode}/disable',
  summary: 'Disable Y-07 brand fee group',
  description: 'ブランド詳細画面の費用タブでサブブランド単位の費用マスタを無効化する。',
  tags: ['Brands'],
  responses: [
    {
      status: 200,
      schema: DisableBrandFeeGroupResponseSchema,
      description: 'Disabled fee group',
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
  _request: NextRequest,
  context: { params: Promise<{ id: string; subBrandCode: string }> },
) {
  try {
    const { id, subBrandCode } = await context.params;
    const brand = db.brands.getByCode(id);
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const disabledGroup = db.brands.disableFeeGroup(id, subBrandCode);
    if (!disabledGroup) {
      return NextResponse.json({ error: 'Fee group not found' }, { status: 404 });
    }

    const response: DisableBrandFeeGroupResponse = {
      message: '費用マスタを無効化しました',
      fee_group: disabledGroup,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error disabling brand fee group:', error);
    return NextResponse.json({ error: 'Failed to disable brand fee group' }, { status: 500 });
  }
}
