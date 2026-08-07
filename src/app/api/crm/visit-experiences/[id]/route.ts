import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import { VisitExperienceDetailSchema } from '@/app/api/_schemas/visit-experience.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/visit-experiences/{id}',
  summary: 'Get visit experience detail',
  description: 'Get full detail of a visit/experience reservation',
  tags: ['Visit Experiences'],
  parameters: [{ name: 'id', in: 'path', required: true, description: 'Visit experience id' }],
  responses: [
    {
      status: 200,
      schema: VisitExperienceDetailSchema,
      description: 'Visit experience detail',
    },
    { status: 404, schema: ErrorResponseSchema, description: 'Not found' },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = db.visitExperiences.getById(id);

    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching visit experience detail:', error);
    return NextResponse.json({ error: 'Failed to fetch visit experience' }, { status: 500 });
  }
}
