import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetChangeHistoryResponse,
  GetChangeHistoryResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/change-history',
  summary: 'Get member change history',
  description: 'Get the member change history (5-source union), paginated',
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
      schema: { type: 'number' },
    },
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Records per page',
      schema: { type: 'number' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetChangeHistoryResponseSchema,
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

const buildChangeHistory = (): GetChangeHistoryResponse['items'] => [
  {
    id: 'ch-001',
    source: 'contract_status',
    changedAt: '2026-04-01T10:00:00.000Z',
    action: 'ステータス変更',
    operatorName: '山田 花子',
    operatorType: 'staff',
    changes: [{ field: 'ステータス', fieldCode: 'status', before: '有効', after: '休会中' }],
  },
  {
    id: 'ch-002',
    source: 'plan_change_application',
    changedAt: '2025-06-01T10:00:00.000Z',
    action: '主契約変更',
    operatorName: '田中 太郎',
    operatorType: 'staff',
    changes: [
      { field: '主契約', fieldCode: 'contract', before: 'レギュラー会員', after: 'ナイト会員' },
    ],
  },
  {
    id: 'ch-003',
    source: 'member',
    changedAt: '2024-11-20T10:00:00.000Z',
    action: '個人情報変更',
    operatorName: '田中 太郎',
    operatorType: 'staff',
    changes: [
      { field: '電話番号', fieldCode: 'phone', before: '090-1111-2222', after: '090-1234-5678' },
    ],
  },
  {
    id: 'ch-004',
    source: 'member',
    changedAt: '2024-01-15T10:00:00.000Z',
    action: '新規作成',
    operatorName: 'システム',
    operatorType: 'system',
    changes: [{ field: '入会', fieldCode: 'other', before: null, after: 'Fit365八潮店で入会' }],
  },
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Number(searchParams.get('limit') ?? '20'));

    const all = buildChangeHistory();
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    const response: GetChangeHistoryResponse = {
      items,
      total: all.length,
      page,
      limit,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching change history:', error);
    return NextResponse.json({ error: 'Failed to fetch change history' }, { status: 500 });
  }
}
