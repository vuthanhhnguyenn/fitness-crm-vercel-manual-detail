import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const DemoUserSchema = z
  .object({
    id: z.string().openapi({ example: 'U-001' }),
    name: z.string().openapi({ example: '本部 花子' }),
    email: z.string().email().openapi({ example: 'admin@example.com' }),
    role: z
      .enum(['System', 'Headquarter', 'Manager', 'Staff', 'Trainer', 'Observer'])
      .openapi({ example: 'Headquarter' }),
    position: z.string().openapi({ example: '本部管理者' }),
  })
  .openapi({ title: 'DemoUser' });

const GetUsersResponseSchema = z
  .object({
    users: z.array(DemoUserSchema),
  })
  .openapi({ title: 'GetUsersResponse' });

const ErrorResponseSchema = z.object({ error: z.string() }).openapi({ title: 'ErrorResponse' });

registerRoute({
  method: 'get',
  path: '/crm/users',
  summary: 'Get demo users list',
  description: 'Returns all demo users for the role-switch feature (demo mode only)',
  tags: ['Users'],
  responses: [
    { status: 200, schema: GetUsersResponseSchema, description: 'List of demo users' },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal server error' },
  ],
});

export async function GET() {
  try {
    const users = db.users.getList().map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      position: u.position,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /crm/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
