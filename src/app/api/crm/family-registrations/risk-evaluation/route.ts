import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  RiskEvaluationRequestSchema,
  RiskEvaluationResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/family-registrations/risk-evaluation',
  summary: 'Family registration risk evaluation',
  tags: ['Family Registrations'],
  requestBody: { schema: RiskEvaluationRequestSchema },
  responses: [
    { status: 200, schema: RiskEvaluationResponseSchema, description: 'Risk evaluation result' },
    { status: 400, schema: ErrorResponseSchema, description: 'Invalid body' },
    { status: 404, schema: ErrorResponseSchema, description: 'Primary member not found' },
  ],
});

// POST /api/crm/family-registrations/risk-evaluation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = RiskEvaluationRequestSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: errors }, { status: 400 });
  }

  const { primary_member_id, applicant } = validation.data;
  const primary = db.members.get(primary_member_id);
  if (!primary) {
    return NextResponse.json({ error: 'Primary member not found' }, { status: 404 });
  }

  // Mocked checks based on spec (age, blacklist, duplicate, relationship, limit, etc.)
  const reasons: string[] = [];
  const birthday = new Date(applicant.birthday);
  const age = Math.floor((Date.now() - birthday.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age < 15) reasons.push('age_under_15');

  // very rough "blacklist" heuristic: match primary email/phone partially
  if (
    applicant.email &&
    (applicant.email === primary.basic_info.email || applicant.email.includes('@blacklist'))
  ) {
    reasons.push('blacklist_match_email');
  }

  // duplicate heuristic: already exists in members list by email
  const dup = applicant.email
    ? db.members.getList().some((m) => m.email.toLowerCase() === applicant.email!.toLowerCase())
    : false;
  if (dup) reasons.push('duplicate_member_by_email');

  const { settings, members } = db.family.getFamilyMembers(primary_member_id);
  if (members.length >= settings.family_member_limit) reasons.push('family_member_limit_reached');

  // Determine risk score
  let risk_score = 10;
  if (reasons.includes('age_under_15')) risk_score += 50;
  if (reasons.some((r) => r.startsWith('blacklist_match'))) risk_score += 60;
  if (reasons.includes('duplicate_member_by_email')) risk_score += 40;
  if (reasons.includes('family_member_limit_reached')) risk_score += 30;
  risk_score = Math.min(100, risk_score);

  const recommended_action =
    risk_score >= 80 ? 'reject' : risk_score >= 60 ? 'manual_review' : 'auto_approve';

  return NextResponse.json({
    risk_score,
    reasons: reasons.length ? reasons : ['ok'],
    recommended_action,
  });
}
