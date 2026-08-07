import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type UpdateMarketingConsentRequest,
  UpdateMarketingConsentRequestSchema,
  type UpdateMarketingConsentResponse,
  UpdateMarketingConsentResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'put',
  path: '/crm/members/{id}/marketing-consent',
  summary: 'Update member marketing consent',
  description: 'Update marketing consent preferences of a member',
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
  requestBody: {
    schema: UpdateMarketingConsentRequestSchema,
    description: 'Updated marketing consent',
  },
  responses: [
    {
      status: 200,
      schema: UpdateMarketingConsentResponseSchema,
      description: 'Marketing consent updated successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = UpdateMarketingConsentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: UpdateMarketingConsentRequest = validationResult.data;
    const updatedMember = db.members.updateMarketingConsent(id, validatedBody);
    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const response: UpdateMarketingConsentResponse = updatedMember.consent
      ?.marketing_consent as any;
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Failed to update marketing consent' }, { status: 500 });
  }
}
