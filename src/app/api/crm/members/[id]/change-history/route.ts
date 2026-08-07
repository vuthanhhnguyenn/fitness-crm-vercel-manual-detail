import { NextResponse } from 'next/server';

import { ErrorResponseSchema } from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/change-history',
  summary: 'Get member change history',
  description: 'Get change history for a member',
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
      schema: z
        .object({
          timeline: z.array(z.any()).openapi({
            description: 'Timeline of changes',
          }),
          membershipHistory: z.any().openapi({
            description: 'Membership history',
          }),
          transferHistory: z.array(z.any()).openapi({
            description: 'Transfer history',
          }),
          suspensionHistory: z.array(z.any()).openapi({
            description: 'Suspension history',
          }),
          withdrawalHistory: z.array(z.any()).openapi({
            description: 'Withdrawal history',
          }),
          editHistory: z.array(z.any()).openapi({
            description: 'Edit history',
          }),
        })
        .openapi({
          title: 'GetChangeHistoryResponse',
          description: 'Response for getting change history',
        }),
      description: 'Change history',
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

export async function GET() {
  try {
    const mockData = {
      timeline: [
        {
          id: 'ch-001',
          date: '2024-11-25T18:00:00Z',
          event_type: '来館',
          content: 'Fit365八潮店に来館',
        },
        {
          id: 'ch-002',
          date: '2024-06-01T10:00:00Z',
          event_type: '契約変更',
          content: 'レギュラー会員からナイト会員に変更',
        },
        {
          id: 'ch-003',
          date: '2024-01-15T10:00:00Z',
          event_type: '入会',
          content: 'Fit365八潮店で入会',
        },
      ],
      membershipHistory: {
        joined_at: '2024-01-15T10:00:00Z',
        join_route: 'store' as const,
        join_store: 'Fit365八潮店',
      },
      transferHistory: [],
      suspensionHistory: [],
      withdrawalHistory: [],
      editHistory: [
        {
          date: '2024-11-20T10:00:00Z',
          field: '電話番号',
          old_value: '090-1111-2222',
          new_value: '090-1234-5678',
          edited_by: '田中 太郎',
        },
      ],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching change history:', error);
    return NextResponse.json({ error: 'Failed to fetch change history' }, { status: 500 });
  }
}
