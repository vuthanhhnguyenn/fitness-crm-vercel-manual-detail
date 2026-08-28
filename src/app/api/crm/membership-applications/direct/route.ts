import { NextRequest, NextResponse } from 'next/server';

import { getAllowedStoreIds, getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import {
  DirectEnrollmentRequestSchema,
  DirectEnrollmentResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { hasPermissions } from '@/utils/permission.util';
import { isFuture, isValid } from 'date-fns';

import { Permission, UserRole } from '@/types/permission.type';

registerRoute({
  method: 'post',
  path: '/crm/membership-applications/direct',
  summary: 'Submit direct (admin-screen) enrollment application',
  tags: ['Membership Applications'],
  requestBody: { schema: DirectEnrollmentRequestSchema, description: 'Direct enrollment request' },
  responses: [
    { status: 201, schema: DirectEnrollmentResponseSchema, description: 'Application created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    {
      status: 409,
      schema: ErrorResponseSchema,
      description: 'Duplicate active application by email',
    },
  ],
});

// TODO(CODE-RULE-V): date-fns's differenceInYears() reads local-timezone date
// parts, not UTC ones — swapping it in here would change the result whenever
// the server's local timezone isn't UTC. Left on native Date/UTC getters to
// avoid a behavior change; revisit if/when a UTC-safe date-fns helper is adopted.
function calcAge(birthDate: string): number {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (
      !hasPermissions(authResult.user.role as UserRole, [Permission.MembershipApplicationsCreate])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const allowedStoreIds = getAllowedStoreIds(authResult.user);
    if (allowedStoreIds !== null && allowedStoreIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: unknown = await request.json();
    const result = DirectEnrollmentRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 },
      );
    }
    const data = result.data;

    // The enrolling store must lie inside the caller's scope (FR-016).
    if (allowedStoreIds !== null && !allowedStoreIds.includes(data.contract.store_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Age check (FR-046) — the brand minimum age lives in one constant map
    // shared by the form and the route.
    const age = calcAge(data.applicant.birth_date);
    const minAge = db.membershipApplications.brandMinAge(data.contract.brand_id);
    if (age < minAge) {
      return NextResponse.json(
        { error: `申請者の年齢が${minAge}歳未満のため申請できません。` },
        { status: 400 },
      );
    }

    // Parental consent required under 18 (FR-047).
    if (age < 18 && !data.consent.parental_consent) {
      return NextResponse.json(
        { error: '未成年の申請には保護者の同意確認が必要です。' },
        { status: 400 },
      );
    }

    // Agreement timestamp present and not in the future (FR-051).
    const agreement = new Date(data.consent.agreement_datetime);
    if (!isValid(agreement) || isFuture(agreement)) {
      return NextResponse.json({ error: '合意日時を正しく入力してください。' }, { status: 400 });
    }

    // JOYFIT enrolment-fee master must be an active master for the brand (FR-053).
    if (data.contract.brand_id === 'JOYFIT') {
      const masterId = data.contract.enrollment_fee_master_id;
      const master = masterId
        ? db.enrollmentFeeMasters.getAll().find((m) => m.id === masterId && m.isActive)
        : undefined;
      if (!master) {
        return NextResponse.json(
          { error: '有効な入会金マスタを選択してください。' },
          { status: 400 },
        );
      }
    }

    // Duplicate active application by e-mail.
    if (db.membershipApplications.hasActiveApplicationForEmail(data.applicant.email)) {
      return NextResponse.json(
        { error: '同じメールアドレスの申請が既に受付中です。' },
        { status: 409 },
      );
    }

    // Mock BL pre-check — a fixed family name simulates a match for demo purposes.
    const blacklistState = data.applicant.family_name === '田中' ? 'matched' : 'no_match';

    const application = db.membershipApplications.createDirect(data, blacklistState, {
      id: authResult.user.staff_id ?? authResult.user.id,
      name: authResult.user.name,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error creating direct enrollment application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
