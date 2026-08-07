import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const SwitchUserRequestSchema = z
  .object({
    user_id: z.string().min(1).openapi({ example: 'U-001' }),
  })
  .openapi({ title: 'SwitchUserRequest' });

const SwitchUserResponseSchema = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.string(),
  })
  .openapi({ title: 'SwitchUserResponse' });

const ErrorResponseSchema = z.object({ error: z.string() }).openapi({ title: 'ErrorResponse' });

registerRoute({
  method: 'post',
  path: '/auth/switch-user',
  summary: 'Switch demo user',
  description: 'Switch the current session to a different demo user (demo mode only)',
  tags: ['Authentication'],
  requestBody: { schema: SwitchUserRequestSchema, description: 'Target user ID' },
  responses: [
    {
      status: 200,
      schema: SwitchUserResponseSchema,
      description: 'New tokens for the target user',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Bad request' },
    { status: 404, schema: ErrorResponseSchema, description: 'User not found' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

function generateToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa('mock-signature');
  return `${header}.${body}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SwitchUserRequestSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const user = db.users.getById(parsed.data.user_id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const access_token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: now,
      exp: now + 86400,
    });
    const refresh_token = generateToken({
      id: user.id,
      email: user.email,
      iat: now,
      exp: now + 86400 * 7,
    });

    return NextResponse.json({ access_token, refresh_token, token_type: 'Bearer' });
  } catch (error) {
    console.error('POST /auth/switch-user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
