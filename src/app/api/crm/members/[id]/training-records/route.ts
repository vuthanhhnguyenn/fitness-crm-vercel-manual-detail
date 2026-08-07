import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  GetTrainingRecordsPathParamsSchema,
  GetTrainingRecordsQuerySchema,
  GetTrainingRecordsResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members/{id}/training-records',
  summary: 'Get member training records',
  description: 'Get training records for a member',
  tags: ['Members'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Member ID',
      schema: { type: 'string' },
    },
    {
      name: 'period',
      in: 'query',
      required: false,
      description: 'Period filter for training records',
      schema: {
        type: 'string',
        enum: ['all', 'this_month', 'last_3_months'],
      },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetTrainingRecordsResponseSchema,
      description: 'Training records',
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedPath = GetTrainingRecordsPathParamsSchema.parse(await params);
    void parsedPath.id;
    const { period } = GetTrainingRecordsQuerySchema.parse({
      period: request.nextUrl.searchParams.get('period') ?? undefined,
    });

    const allTrainingHistory = [
      {
        id: 'training-001',
        date: '2026-04-17',
        routineName: '全身強化',
        durationMin: 55,
        calories: 360,
      },
      {
        id: 'training-002',
        date: '2026-04-14',
        routineName: '下半身集中',
        durationMin: 60,
        calories: 410,
      },
      {
        id: 'training-003',
        date: '2026-04-10',
        routineName: '全身強化',
        durationMin: 52,
        calories: 345,
      },
      {
        id: 'training-004',
        date: '2026-03-24',
        routineName: '有酸素ミックス',
        durationMin: 40,
        calories: 280,
      },
      {
        id: 'training-005',
        date: '2026-03-10',
        routineName: '全身強化',
        durationMin: 58,
        calories: 390,
      },
      {
        id: 'training-006',
        date: '2026-02-06',
        routineName: 'コア集中',
        durationMin: 35,
        calories: 240,
      },
      {
        id: 'training-007',
        date: '2026-01-20',
        routineName: '有酸素ミックス',
        durationMin: 45,
        calories: 300,
      },
      {
        id: 'training-008',
        date: '2026-01-04',
        routineName: '全身強化',
        durationMin: 48,
        calories: 320,
      },
    ];

    const monthsByPeriod = period === 'this_month' ? 1 : period === 'last_3_months' ? 3 : null;
    const now = new Date();
    const filteredHistory =
      monthsByPeriod === null
        ? allTrainingHistory
        : allTrainingHistory.filter((record) => {
            const recordDate = new Date(record.date);
            const monthDiff =
              (now.getFullYear() - recordDate.getFullYear()) * 12 +
              (now.getMonth() - recordDate.getMonth());
            return monthDiff >= 0 && monthDiff < monthsByPeriod;
          });

    const routineCountMap = filteredHistory.reduce<Record<string, number>>((acc, item) => {
      acc[item.routineName] = (acc[item.routineName] ?? 0) + 1;
      return acc;
    }, {});

    const mostFrequentRoutineName =
      Object.entries(routineCountMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const mockData = GetTrainingRecordsResponseSchema.parse({
      summary: {
        trainingCount: filteredHistory.length,
        totalDurationMin: filteredHistory.reduce((sum, item) => sum + item.durationMin, 0),
        totalCalories: filteredHistory.reduce((sum, item) => sum + item.calories, 0),
        mostFrequentRoutineName,
      },
      trainingHistory: filteredHistory,
    });

    return NextResponse.json(mockData);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch training records' }, { status: 500 });
  }
}
