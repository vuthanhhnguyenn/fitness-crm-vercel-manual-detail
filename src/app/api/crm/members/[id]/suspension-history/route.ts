import { NextRequest, NextResponse } from 'next/server';

import { toApiYearMonth } from '@/app/api/_lib/year-month';
import { db } from '@/app/api/_mock-db';
import type { LeaveListItem } from '@/app/api/_schemas/leave.schema';
import {
  ErrorResponseSchema,
  GetSuspensionHistoryResponseSchema,
  type SuspensionHistoryItem,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/suspension-history',
  summary: 'Get member suspension / withdrawal history',
  description: 'Get suspension / withdrawal history (休会・退会履歴) for a member',
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
      schema: GetSuspensionHistoryResponseSchema,
      description: 'Suspension / withdrawal history',
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

/** Map a 休会/退会 row status onto the strip's status vocabulary. */
function toStripStatus(row: LeaveListItem): SuspensionHistoryItem['status'] {
  switch (row.status) {
    case 'suspended':
      return 'active';
    case 'suspension_scheduled':
    case 'withdrawal_scheduled':
    case 'withdrawal_pending':
      return 'pending';
    default:
      // 'completed' — the suspension ran its course / the withdrawal was executed
      return 'ended';
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Built from the member's actual 休会/退会 applications so the strip reflects operations
    // performed on this screen (休会申請 / 退会申請 / 休会解除), not a static sample.
    const items = db.memberLeaves
      .list()
      .filter((row) => row.member_id === id)
      .map((row) => ({
        id: row.id,
        type:
          row.type === 'suspension' ? ('suspension' as const) : ('withdrawal_scheduled' as const),
        status: toStripStatus(row),
        // Rows are stored in the `YYYY/MM` display format; the API contract is `YYYY-MM`.
        // Withdrawal rows carry a full date (`YYYY/MM/DD`) — keep only its year-month.
        startMonth: toApiYearMonth(row.scheduled_date.slice(0, 7)),
        endMonth: row.end_date ? toApiYearMonth(row.end_date.slice(0, 7)) : null,
      }))
      .sort((a, b) => a.startMonth.localeCompare(b.startMonth));

    return NextResponse.json(GetSuspensionHistoryResponseSchema.parse({ items }));
  } catch (error) {
    console.error('[GET /crm/members/[id]/suspension-history]', error);
    return NextResponse.json({ error: 'Failed to fetch suspension history' }, { status: 500 });
  }
}
