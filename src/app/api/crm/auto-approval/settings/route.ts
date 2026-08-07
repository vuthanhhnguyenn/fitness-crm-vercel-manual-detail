import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  type GetSettingsResponse,
  GetSettingsResponseSchema,
  type UpdateSettingsRequest,
  UpdateSettingsRequestSchema,
  type UpdateSettingsResponse,
  UpdateSettingsResponseSchema,
} from '@/app/api/_schemas/auto-approval.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for GET route
registerRoute({
  method: 'get',
  path: '/crm/auto-approval/settings',
  summary: 'Get auto-approval settings',
  description: 'Get current auto-approval settings configuration',
  tags: ['Auto Approval'],
  responses: [
    {
      status: 200,
      schema: GetSettingsResponseSchema,
      description: 'Auto-approval settings',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// Register OpenAPI documentation for PUT route
registerRoute({
  method: 'put',
  path: '/crm/auto-approval/settings',
  summary: 'Update auto-approval settings',
  description: 'Update auto-approval settings configuration',
  tags: ['Auto Approval'],
  requestBody: {
    schema: UpdateSettingsRequestSchema,
    description: 'Updated settings',
  },
  responses: [
    {
      status: 200,
      schema: UpdateSettingsResponseSchema,
      description: 'Settings updated successfully',
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

// GET /api/crm/auto-approval/settings - 設定取得
export async function GET() {
  try {
    // Mock auto-approval settings
    const response: GetSettingsResponse = {
      settings: {
        enabled: true,
        risk_score_threshold: 70,
        auto_approve_below_threshold: true,
        require_manual_review_above_threshold: true,
        blacklist_check_enabled: true,
        duplicate_check_enabled: true,
        payment_verification_required: true,
        document_verification_required: true,
        notification_settings: {
          notify_on_high_risk: true,
          notify_on_blacklist_match: true,
          notify_on_duplicate: true,
          email_recipients: ['admin@example.com'],
        },
        updated_at: new Date().toISOString(),
        updated_by: 'admin-001',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching auto-approval settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/crm/auto-approval/settings - 設定更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = UpdateSettingsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: UpdateSettingsRequest = validationResult.data;

    // Mock update result
    const response: UpdateSettingsResponse = {
      success: true,
      settings: {
        ...validatedBody,
        updated_at: new Date().toISOString(),
        updated_by: validatedBody.updated_by || 'admin-001',
      } as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating auto-approval settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
