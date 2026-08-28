import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema, MeResponse, MeResponseSchema } from '@/app/api/_schemas/auth.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { decodeJWT } from '@/utils/auth.util';

registerRoute({
  method: 'get',
  path: '/auth/me',
  summary: 'Get current user',
  description: 'Returns the authenticated user profile decoded from the Bearer token',
  tags: ['Authentication'],
  responses: [
    {
      status: 200,
      schema: MeResponseSchema,
      description: 'Current user profile',
    },
    { status: 401, schema: ErrorResponseSchema, description: 'Unauthorized' },
  ],
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = decodeJWT(token) as { id?: string } | null;
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = db.users.getById(payload.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const linkedStaff = user.staff_id
      ? db.staffs.getList().find((s) => s.staff_id === user.staff_id)
      : undefined;

    const body: MeResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      position: user.position,
      staff_id: linkedStaff?.id ?? '',
      managed_store_ids: user.role === 'Manager' ? (user.managed_store_ids ?? []) : undefined,
    };

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error('GET /auth/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
