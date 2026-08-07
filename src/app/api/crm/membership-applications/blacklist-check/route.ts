import { NextRequest, NextResponse } from 'next/server';

import {
  BlacklistCheckRequestSchema,
  BlacklistCheckResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/membership-applications/blacklist-check',
  summary: 'Blacklist check',
  tags: ['Membership Applications'],
  requestBody: { schema: BlacklistCheckRequestSchema, description: 'Applicant info for BL check' },
  responses: [
    { status: 200, schema: BlacklistCheckResponseSchema, description: 'Blacklist check result' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const result = BlacklistCheckRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 },
      );
    }

    const matched = result.data.last_name_kanji === '田中';
    return NextResponse.json({ checked: true, matched }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
