import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DirectEnrollmentRequestBaseSchema,
  DirectEnrollmentResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { calcAge, getMinAge, isBelowMinAge } from '@/utils/age.util';
import { addMonths, isAfter, parseISO, startOfDay } from 'date-fns';

registerRoute({
  method: 'post',
  path: '/crm/membership-applications/direct',
  summary: 'Submit direct enrollment application',
  tags: ['Membership Applications'],
  requestBody: {
    schema: DirectEnrollmentRequestBaseSchema,
    description: 'Direct enrollment request',
  },
  responses: [
    { status: 201, schema: DirectEnrollmentResponseSchema, description: 'Application created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 409, schema: ErrorResponseSchema, description: 'Duplicate active member by email' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = DirectEnrollmentRequestBaseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 },
      );
    }

    const data = result.data;

    // Age check
    const age = calcAge(data.applicant.date_of_birth);
    const brand = data.contract.brand;
    if (isBelowMinAge(age, brand)) {
      return NextResponse.json(
        { error: `申請者の年齢が${getMinAge(brand)}歳未満のため申請できません。` },
        { status: 400 },
      );
    }

    // Start date check: must not be > today + 2 months
    const maxStartDate = addMonths(startOfDay(new Date()), 2);
    const startDate = parseISO(data.contract.start_date);
    if (isAfter(startDate, maxStartDate)) {
      return NextResponse.json(
        { error: '利用開始日は本日から2ヶ月以内に設定してください。' },
        { status: 400 },
      );
    }

    // Duplicate email check (active members)
    const existingMembers = db.members.getList();
    const emailLower = data.applicant.email.toLowerCase();
    const duplicate = existingMembers.some((m) => m.email?.toLowerCase() === emailLower);
    if (duplicate) {
      return NextResponse.json(
        { error: '同じメールアドレスのアクティブ会員が既に存在します。' },
        { status: 409 },
      );
    }

    // Mock BL check
    const blMatched = data.applicant.last_name_kanji === '田中';

    const application = db.membershipApplications.createDirect(data, blMatched);
    const memberId = `MBR-DIRECT-${Date.now()}`;

    return NextResponse.json(
      { applicationId: application.id, memberId, status: 'pending' },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
