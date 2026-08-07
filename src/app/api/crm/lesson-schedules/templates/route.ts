import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  type CreateTemplateRequest,
  CreateTemplateRequestSchema,
  CreateTemplateResponseSchema,
  ErrorResponseSchema,
  GetTemplatesResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/lesson-schedules/templates',
  summary: 'List templates',
  description: 'Get saved recurring schedule templates',
  tags: ['LessonSchedules'],
  responses: [
    { status: 200, schema: GetTemplatesResponseSchema, description: 'Template list' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

registerRoute({
  method: 'post',
  path: '/crm/lesson-schedules/templates',
  summary: 'Create template',
  description: 'Save a new recurring schedule template',
  tags: ['LessonSchedules'],
  requestBody: { schema: CreateTemplateRequestSchema, description: 'Template data' },
  responses: [
    { status: 201, schema: CreateTemplateResponseSchema, description: 'Template created' },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET() {
  try {
    const templates = db.templates.getList();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('GET /crm/lesson-schedules/templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTemplateRequest = await request.json();

    const parsed = CreateTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const template = db.templates.create(parsed.data);
    return NextResponse.json(
      { id: template.id, message: 'テンプレートを保存しました' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /crm/lesson-schedules/templates error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
