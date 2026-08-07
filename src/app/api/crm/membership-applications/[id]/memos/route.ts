import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateMemoRequestSchema,
  CreateMemoResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for POST route
registerRoute({
  method: 'post',
  path: '/crm/membership-applications/{id}/memos',
  summary: 'Add memo to membership application',
  description: 'Add a new memo to the activity timeline of a membership application',
  tags: ['Membership Applications'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Membership application ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: CreateMemoRequestSchema,
  },
  responses: [
    {
      status: 200,
      schema: CreateMemoResponseSchema,
      description: 'Memo created successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid body',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Application not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// POST /api/crm/membership-applications/{id}/memos - メモ追加
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = CreateMemoRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { content } = validationResult.data;

    // Check if application exists
    const application = db.membershipApplications.getById(id);
    if (!application) {
      return NextResponse.json({ error: 'Membership application not found' }, { status: 404 });
    }

    // Add memo - using 管理者A as default operator
    // In a real app, this would come from the authenticated user context
    const operator = '管理者A';
    const updatedTimeline = db.membershipApplications.addMemo(id, content, operator);

    if (!updatedTimeline || updatedTimeline.length === 0) {
      return NextResponse.json({ error: 'Failed to add memo' }, { status: 500 });
    }

    // Return the newly created memo (first item in timeline)
    const newMemo = updatedTimeline[0];

    return NextResponse.json(newMemo, { status: 200 });
  } catch (error) {
    console.error('Error adding memo:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
