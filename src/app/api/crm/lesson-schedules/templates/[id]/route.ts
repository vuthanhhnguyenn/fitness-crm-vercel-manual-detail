import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  DeleteTemplateResponseSchema,
  ErrorResponseSchema,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'delete',
  path: '/crm/lesson-schedules/templates/{id}',
  summary: 'Delete template',
  description: 'Delete a saved recurring schedule template',
  tags: ['LessonSchedules'],
  parameters: [{ name: 'id', in: 'path', required: true, description: 'Template ID' }],
  responses: [
    { status: 200, schema: DeleteTemplateResponseSchema, description: 'Template deleted' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const deleted = db.templates.deleteById(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'テンプレートを削除しました' });
  } catch (error) {
    console.error('DELETE /crm/lesson-schedules/templates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
