import { NextRequest, NextResponse } from 'next/server';

import { filterPaymentHistoryByPeriod } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  PaymentHistoryListResponseSchema,
  PaymentPeriodSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/payment-history',
  summary: 'Get member payment history',
  description: 'Get payment history (入出金明細) for a member with optional filtering',
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
      name: 'page',
      in: 'query',
      required: false,
      description: 'Page number (1-based)',
      schema: { type: 'integer' },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Number of records per page',
      schema: { type: 'integer' },
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
    {
      name: 'type',
      in: 'query',
      required: false,
      description: 'Filter by type',
      schema: {
        type: 'string',
        enum: ['all', 'sale', 'refund'],
      },
    },
  ],
  responses: [
    {
      status: 200,
      schema: PaymentHistoryListResponseSchema,
      description: 'Payment history',
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

// Query parameter schema
const PaymentHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  period: PaymentPeriodSchema.default('all'),
  type: z.enum(['all', 'sale', 'refund']).default('all'),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Parse and validate query parameters
    const query = Object.fromEntries(_request.nextUrl.searchParams);
    const queryResult = PaymentHistoryQuerySchema.safeParse(query);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
        },
        { status: 400 },
      );
    }

    const { page, limit, period, type } = queryResult.data;

    // Shares the same period filter as the payment summary
    let filtered = filterPaymentHistoryByPeriod(period, id);

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter((item) => item.type === type);
    }

    // Apply pagination
    const total = filtered.length;
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const items = filtered.slice(startIdx, endIdx);

    return NextResponse.json(
      {
        items: items.map((item, index) => ({
          // Mock: the seed rows carry no primary key, so derive a stable id from the
          // member + position in the (deterministically ordered) filtered list.
          id: `payment-history-${id}-${startIdx + index}`,
          date: item.date,
          type: item.type,
          content: item.content,
          amount: item.amount,
          method: item.method,
        })),
        total,
        page,
        limit,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in GET /crm/members/{id}/payment-history:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
