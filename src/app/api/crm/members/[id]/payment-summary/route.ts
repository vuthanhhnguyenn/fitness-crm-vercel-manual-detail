import { NextRequest, NextResponse } from 'next/server';

import { getPaymentSummary } from '@/app/api/_mock-db';
import { ErrorResponseSchema, PaymentSummarySchema } from '@/app/api/_schemas/member.schema';
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
  ],
  responses: [
    {
      status: 200,
      schema: PaymentSummarySchema,
      description: 'Payment summary',
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
    await params; // Verify params can be awaited (member exists check moved to middleware)

    const summary = getPaymentSummary();

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
