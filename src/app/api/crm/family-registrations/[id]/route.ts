import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetFamilyRegistrationDetailResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/family-registrations/{id}',
  summary: 'Get family registration detail',
  tags: ['Family Registrations'],
  parameters: [{ name: 'id', in: 'path', required: true, description: 'Family registration id' }],
  responses: [
    { status: 200, schema: GetFamilyRegistrationDetailResponseSchema, description: 'Detail' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

// GET /api/crm/family-registrations/{id}
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = db.family.getRegistrationById(id);
  if (!row) {
    return NextResponse.json({ error: 'Family registration not found' }, { status: 404 });
  }

  const primary = db.members.get(row.primary_member_id);
  const { settings, members: familyMembers } = db.family.getFamilyMembers(row.primary_member_id);

  // 在籍期間（月数）
  const tenureMonths = primary?.profile.joined_at
    ? Math.floor(
        (Date.now() - new Date(primary.profile.joined_at).getTime()) / (1000 * 60 * 60 * 24 * 30),
      )
    : undefined;

  // 主会員IDの末尾数字でモック値を決定論的に生成
  const memberIndex = parseInt(row.primary_member_id.replace(/\D/g, '') || '0', 10);

  return NextResponse.json({
    registration: {
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      primary_member_id: row.primary_member_id,
      primary_member_name: primary?.basic_info.name_kanji ?? '—',
      applicant_name: row.applicant_name,
      relationship: row.relationship,
      invite_expires_at: row.invite_expires_at,
      store_id: primary?.profile.store_id ?? '—',
      store_name: primary?.profile.store_name ?? '—',
      monthly_fee: settings.family_member_fee,
      risk_score: row.risk_score,
      risk_reason: row.risk_reason,
      risk_details: row.risk_score
        ? [
            {
              reason: row.risk_reason ?? '',
              score: row.risk_score,
              description: 'リスク詳細の説明',
            },
          ]
        : [],
      ekyc: row.ekyc,
      applicant: row.applicant,
      primary_member: primary
        ? {
            member_number: primary.basic_info.member_number,
            status: primary.profile.status,
            member_type: primary.profile.member_type,
            joined_at: primary.profile.joined_at,
            tenure_months: tenureMonths,
            family_member_count: familyMembers.length,
            family_member_limit: settings.family_member_limit,
            has_unpaid: (primary as any)._listMeta?.has_unpaid ?? false,
            has_past_unpaid: memberIndex % 4 === 0,
            has_forced_withdrawal: memberIndex % 10 === 0,
            monthly_usage_count: (memberIndex % 20) + 1,
          }
        : undefined,
    },
  });
}
