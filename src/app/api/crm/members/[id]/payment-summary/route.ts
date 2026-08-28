import { NextRequest, NextResponse } from 'next/server';

import { getPaymentSummary } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  PaymentPeriodSchema,
  PaymentSummarySchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/payment-summary',
  summary: 'Get member payment summary',
  description: 'Get payment summary (支払いサマリー) for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
    {
      name: 'period',
      in: 'query',
      required: false,
      description: 'Filter by period',
      schema: {
        type: 'string',
        enum: ['all', 'thisMonth', 'lastMonth', '3months', '6months'],
      },
    },
  ],
  responses: [
    {
      status: 200,
      schema: PaymentSummarySchema,
      description: 'Payment summary',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Invalid query parameters',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
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

    const periodResult = PaymentPeriodSchema.default('all').safeParse(
      _request.nextUrl.searchParams.get('period') ?? undefined,
    );
    if (!periodResult.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const summary = getPaymentSummary(id, periodResult.data);

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('Error in GET /crm/members/{id}/payment-summary:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
