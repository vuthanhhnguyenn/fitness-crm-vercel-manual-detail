import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import {
  BlacklistCheckRequestSchema,
  type BlacklistCheckResponse,
  BlacklistCheckResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/membership-applications/blacklist-check',
  summary: 'Blacklist pre-check',
  description: 'Blacklist pre-check for the admin enrolment form (FR-052)',
  tags: ['Membership Applications'],
  requestBody: { schema: BlacklistCheckRequestSchema, description: 'Applicant info for BL check' },
  responses: [
    { status: 200, schema: BlacklistCheckResponseSchema, description: 'Blacklist check result' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthenticated' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body: unknown = await request.json();
    const result = BlacklistCheckRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 },
      );
    }

    // Mock heuristic — a fixed family name simulates a match for demo purposes.
    const matched = result.data.family_name === '田中';
    const response: BlacklistCheckResponse = {
      state: matched ? 'matched' : 'no_match',
      conditions: matched
        ? [{ condition: 'name_birthdate', label: '氏名＋生年月日', blacklist_entry_id: 'BL-DEMO' }]
        : [],
    };
    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
