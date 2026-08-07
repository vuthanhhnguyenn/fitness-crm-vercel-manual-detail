import { NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  GetBodyDataPathParamsSchema,
  GetBodyDataResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/members/{id}/body-data',
  summary: 'Get member body data',
  description: 'Get body composition, body measurements, history, and weight chart for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetBodyDataResponseSchema,
      description: 'Member body data',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Member not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedPath = GetBodyDataPathParamsSchema.parse(await params);
    void parsedPath.id;

    const mockData = GetBodyDataResponseSchema.parse({
      latest: {
        date: '2026-04-17',
        weight: 68.4,
        bmi: 22.8,
        fatPercent: 18.2,
        muscleMass: 29.6,
        basalMetabolism: 1580,
      },
      bodyComposition: {
        source: 'body_planner',
        weight: 68.4,
        bmi: 22.8,
        fatPercent: 18.2,
        fatMass: 12.5,
        visceralFatIndex: 7.4,
        smi: 7.6,
        muscleMass: 29.6,
        boneMass: 2.9,
        waterContent: 41.2,
        basalMetabolism: 1580,
        leanBodyMass: 55.9,
        limbLeanMass: 21.4,
      },
      bodyMeasurement: {
        source: '3d_scanner',
        neck: 37.5,
        shoulder: 47.1,
        chest: 95.4,
        waistAbdomen: 81.2,
        upperArm: 31.4,
        forearm: 26.8,
        waistHip: 87.3,
        hip: 94.7,
        thigh: 54.8,
        calf: 37.1,
        height: 173.0,
      },
      history: [
        {
          id: 'body-001',
          date: '2026-04-17',
          source: 'body_planner',
          weight: 68.4,
          fatPercent: 18.2,
        },
        {
          id: 'body-002',
          date: '2026-04-10',
          source: 'body_planner',
          weight: 68.9,
          fatPercent: 18.8,
        },
        {
          id: 'body-003',
          date: '2026-04-03',
          source: 'manual',
          weight: 69.2,
          fatPercent: 19.1,
        },
        {
          id: 'body-004',
          date: '2026-03-27',
          source: '3d_scanner',
          weight: 69.7,
          fatPercent: 19.8,
        },
      ],
      weightChart: [
        { date: '03/27', weight: 69.7 },
        { date: '04/03', weight: 69.2 },
        { date: '04/10', weight: 68.9 },
        { date: '04/17', weight: 68.4 },
      ],
    });

    return NextResponse.json(mockData);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch body data' }, { status: 500 });
  }
}
