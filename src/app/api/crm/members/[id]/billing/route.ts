import { NextRequest, NextResponse } from 'next/server';

import { getBillingListForMember } from '@/app/api/_mock-db';
import { ErrorResponseSchema, GetBillingResponseSchema } from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/billing',
  summary: 'Get member billing list',
  description: 'Get billing list (請求一覧) for a member',
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
  ],
  responses: [
    {
      status: 200,
      schema: GetBillingResponseSchema,
      description: 'Billing list',
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
const BillingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Parse and validate query parameters
    const query = Object.fromEntries(_request.nextUrl.searchParams);
    const queryResult = BillingQuerySchema.safeParse(query);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
        },
        { status: 400 },
      );
    }

    const { page, limit } = queryResult.data;

    // Apply pagination
    const billingList = getBillingListForMember(id);
    const total = billingList.length;
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const items = billingList.slice(startIdx, endIdx);

    return NextResponse.json(
      {
        items: items.map((item, index) => ({
          // Mock: the seed rows carry no primary key, so derive a stable id from the
          // member + position in the (deterministically ordered) billing list.
          id: `billing-${id}-${startIdx + index}`,
          month: item.month,
          type: item.type,
          amount: item.amount,
          status: item.status,
          billingDate: item.billingDate,
        })),
        total,
        page,
        limit,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in GET /crm/members/{id}/billing:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
