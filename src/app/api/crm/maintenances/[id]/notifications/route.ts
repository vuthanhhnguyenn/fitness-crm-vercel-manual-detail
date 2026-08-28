import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { SendCrmMaintenanceNotificationResponseSchema } from '@/app/api/_schemas/crm-maintenance.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

const NOT_FOUND_MESSAGE = '該当するメンテナンス情報が見つかりません。';

registerRoute({
  method: 'post',
  path: '/crm/maintenances/{id}/notifications',
  summary: 'Send advance maintenance notification',
  description:
    'Send an advance CRM maintenance notification (System role only, FR-007). Mock: flips the record to notified.',
  tags: ['CRM Maintenance'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'CRM maintenance ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: SendCrmMaintenanceNotificationResponseSchema,
      description: 'Notification sent',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
    { status: 403, schema: ErrorResponseSchema, description: 'Forbidden' },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = getAuthUserFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'System') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const result = db.crmMaintenances.notify(id);

    if (result === 'not_found') {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ message: '通知を送信しました', notified: result.notified });
  } catch (error) {
    console.error('POST /crm/maintenances/[id]/notifications error:', error);
    return NextResponse.json({ error: 'CRMメンテナンス通知の送信に失敗しました' }, { status: 500 });
  }
}
