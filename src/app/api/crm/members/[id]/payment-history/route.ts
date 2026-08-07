import { NextRequest, NextResponse } from 'next/server';

import { MOCK_PAYMENT_HISTORY } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  PaymentHistoryListResponseSchema,
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
      description: 'Filter by period: all, thisMonth, lastMonth, 3months, 6months',
      schema: { type: 'string' },
    },
    {
      name: 'type',
      in: 'query',
      required: false,
      description: 'Filter by type: all, sale, refund',
      schema: { type: 'string' },
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
  period: z.enum(['all', 'thisMonth', 'lastMonth', '3months', '6months']).default('all'),
  type: z.enum(['all', 'sale', 'refund']).default('all'),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params; // Verify params can be awaited (member exists check moved to middleware)

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

    // Filter by period (mock: hardcoded relative to 2026-04-22)
    let filtered = [...MOCK_PAYMENT_HISTORY];

    if (period !== 'all') {
      const now = new Date('2026-04-22');
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date.replaceAll('/', '-'));

        switch (period) {
          case 'thisMonth':
            return itemDate >= monthStart;
          case 'lastMonth':
            return itemDate >= lastMonthStart && itemDate < monthStart;
          case '3months':
            return itemDate >= threeMonthsAgo;
          case '6months':
            return itemDate >= sixMonthsAgo;
          default:
            return true;
        }
      });
    }

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
        items: items.map((item) => ({
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
