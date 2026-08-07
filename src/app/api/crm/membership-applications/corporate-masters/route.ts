import { NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { registerRoute } from '@/app/api/_scripts/register-route';
import { z } from 'zod';

const CorporateMasterSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  })
  .openapi({ title: 'CorporateMaster' });

const GetCorporateMastersResponseSchema = z
  .object({ items: z.array(CorporateMasterSchema) })
  .openapi({ title: 'GetCorporateMastersResponse' });

registerRoute({
  method: 'get',
  path: '/crm/membership-applications/corporate-masters',
  summary: 'Get corporate masters',
  tags: ['Membership Applications'],
  responses: [
    {
      status: 200,
      schema: GetCorporateMastersResponseSchema,
      description: 'List of corporate masters',
    },
  ],
});

export async function GET() {
  const items = db.corporateMasters.getAll();
  return NextResponse.json({ items }, { status: 200 });
}
