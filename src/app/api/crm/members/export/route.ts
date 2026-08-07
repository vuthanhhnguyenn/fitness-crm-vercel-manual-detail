import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  type ExportMembersRequest,
  ExportMembersRequestSchema,
  type ExportMembersResponse,
  ExportMembersResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/crm/members/export',
  summary: 'Export members',
  description: 'Export members data to CSV or Excel',
  tags: ['Members'],
  requestBody: {
    schema: ExportMembersRequestSchema,
    description: 'Export configuration',
  },
  responses: [
    {
      status: 200,
      schema: ExportMembersResponseSchema,
      description: 'Export started successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = ExportMembersRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: ExportMembersRequest = validationResult.data;

    // Mock export response
    const response: ExportMembersResponse = {
      exportId: `export-${Date.now()}`,
      format: validatedBody.format,
      status: 'processing',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error exporting members:', error);
    return NextResponse.json({ error: 'Failed to export members' }, { status: 500 });
  }
}
