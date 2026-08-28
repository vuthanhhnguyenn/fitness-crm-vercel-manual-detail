import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema, GetReferralsResponseSchema } from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/referrals',
  summary: 'Get member referral relationships',
  description: 'Get inbound referrer and invitees for a member',
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
      schema: GetReferralsResponseSchema,
      description: 'Referral relationships',
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

    const member = db.members.get(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const invitees = [
      {
        memberId: `${id}-inv-1`,
        memberNumber: 'M-00021',
        displayName: '田中 一郎',
        joinedAt: '2026-02-10',
        rewardGranted: true,
      },
      {
        memberId: `${id}-inv-2`,
        memberNumber: 'M-00022',
        displayName: '鈴木 二郎',
        joinedAt: '2026-03-15',
        rewardGranted: true,
      },
      {
        memberId: `${id}-inv-3`,
        memberNumber: 'M-00023',
        displayName: '高橋 三郎',
        joinedAt: '2026-05-01',
        rewardGranted: false,
      },
    ];

    const rewardGrantedCount = invitees.filter((invitee) => invitee.rewardGranted).length;

    const mockData = GetReferralsResponseSchema.parse({
      inboundFlag: member.referral.inboundFlag,
      referrer: member.referral.byMember ?? null,
      invitees,
      stats: {
        totalReferred: invitees.length,
        rewardGrantedCount,
        rewardPendingCount: invitees.length - rewardGrantedCount,
      },
    });

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('[GET /crm/members/[id]/referrals]', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
