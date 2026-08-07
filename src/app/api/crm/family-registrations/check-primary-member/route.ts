import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CheckPrimaryMemberRequestSchema,
  CheckPrimaryMemberResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/family-registrations/check-primary-member',
  summary: 'Check primary member eligibility',
  tags: ['Family Registrations'],
  requestBody: { schema: CheckPrimaryMemberRequestSchema },
  responses: [
    { status: 200, schema: CheckPrimaryMemberResponseSchema, description: 'Check result' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 404, schema: ErrorResponseSchema, description: 'Primary member not found' },
  ],
});

// POST /api/crm/family-registrations/check-primary-member
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = CheckPrimaryMemberRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const { primary_member_id } = validation.data;
  const primary = db.members.get(primary_member_id);
  if (!primary) {
    return NextResponse.json({ error: 'Primary member not found' }, { status: 404 });
  }

  const { brand, settings, members } = db.family.getFamilyMembers(primary_member_id);

  const reasons: string[] = [];
  if (primary.profile.status !== 'active') reasons.push('primary_member_status_not_active');
  const hasUnpaid = (primary as any)._listMeta?.has_unpaid ?? false;
  if (hasUnpaid) reasons.push('primary_member_has_unpaid');
  if (members.length >= settings.family_member_limit) reasons.push('family_member_limit_reached');
  if (primary.profile.is_black_listed) reasons.push('primary_member_blacklisted');

  return NextResponse.json({
    ok: reasons.length === 0,
    reasons,
    brand,
    limit: settings.family_member_limit,
    current_count: members.length,
    fee: settings.family_member_fee,
    payment_cycle: settings.payment_cycle,
  });
}
