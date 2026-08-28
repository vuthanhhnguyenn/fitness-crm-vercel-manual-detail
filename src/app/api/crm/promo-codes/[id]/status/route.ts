import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  PromoCodeErrorResponseSchema,
  UpdatePromoCodeStatusBodySchema,
  UpdatePromoCodeStatusResponseSchema,
} from '@/app/api/_schemas/promo-code.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

import { promoCodeErrors, toPromoCodeListItem } from '../../_utils';

registerRoute({
  method: 'patch',
  path: '/crm/promo-codes/{id}/status',
  summary: 'Disable or re-enable a promotion code',
  description:
    'プロモーションコードを無効化・再有効化する。無効化理由は操作履歴に記録される (G-06 FR-007)',
  tags: ['PromoCodes'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Promotion code ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdatePromoCodeStatusBodySchema,
    description: 'ステータス変更リクエスト',
  },
  responses: [
    { status: 200, schema: UpdatePromoCodeStatusResponseSchema, description: 'Updated' },
    { status: 400, schema: PromoCodeErrorResponseSchema, description: 'Validation error' },
    { status: 404, schema: PromoCodeErrorResponseSchema, description: 'Not found' },
    { status: 409, schema: PromoCodeErrorResponseSchema, description: 'Conflicting state' },
    { status: 500, schema: PromoCodeErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = UpdatePromoCodeStatusBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return promoCodeErrors.validation(
        parsed.error.issues.map((issue) => issue.message).join(', '),
      );
    }

    const row = db.promoCodes.getById(id);
    if (!row) return promoCodeErrors.notFound();

    const { action, reason } = parsed.data;

    if (action === 'disable' && row.status === 'disabled') {
      return promoCodeErrors.conflict('このコードは既に無効化されています');
    }
    if (action === 're_enable' && row.status !== 'disabled') {
      return promoCodeErrors.conflict('無効化されていないコードは再有効化できません');
    }

    const changedAt = new Date().toISOString();
    const updated = db.promoCodes.update(id, {
      status: action === 'disable' ? 'disabled' : 'active',
      disabled_reason: action === 'disable' ? (reason ?? null) : null,
      updated_at: changedAt,
    });
    if (!updated) return promoCodeErrors.notFound();

    return NextResponse.json(
      {
        message:
          action === 'disable'
            ? 'プロモーションコードを無効化しました'
            : 'プロモーションコードを再有効化しました',
        promoCode: toPromoCodeListItem(updated),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PATCH /crm/promo-codes/[id]/status error:', error);
    return promoCodeErrors.internal('Failed to update promotion code status');
  }
}
