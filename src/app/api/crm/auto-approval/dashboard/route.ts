import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  type GetDashboardQuery,
  GetDashboardQuerySchema,
  type GetDashboardResponse,
  GetDashboardResponseSchema,
} from '@/app/api/_schemas/auto-approval.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/auto-approval/dashboard',
  summary: 'Get auto-approval dashboard',
  description: 'Get dashboard data for auto-approval system',
  tags: ['Auto Approval'],
  query: GetDashboardQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetDashboardResponseSchema,
      description: 'Dashboard data',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid query parameters',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// GET /api/crm/auto-approval/dashboard - ダッシュボード取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build query object from searchParams
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    // Validate query parameters with Zod
    const validationResult = GetDashboardQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetDashboardQuery = validationResult.data;
    const { period = 'month' } = query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Mock dashboard data
    const response: GetDashboardResponse = {
      dashboard: {
        period,
        date_range: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
        statistics: {
          total_applications: 200,
          auto_approved: 163,
          manual_approved: 21,
          rejected: 21,
          auto_approval_rate: 82.5,
          average_processing_time_minutes: 83, // 1h23m
          average_risk_score: 45.2,
        },
        risk_distribution: {
          low_risk: 850, // risk_score < 30
          medium_risk: 300, // 30 <= risk_score < 70
          high_risk: 84, // risk_score >= 70
        },
        rejection_reasons: {
          blacklist_match: 5,
          duplicate_application: 8,
          payment_failure: 3,
          high_risk_score: 4,
          document_issue: 1,
          other: 0,
        },
        daily_trends: Array.from({ length: 30 }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          return {
            date: date.toISOString().split('T')[0],
            total: Math.floor(Math.random() * 50) + 20,
            auto_approved: Math.floor(Math.random() * 40) + 15,
            manual_approved: Math.floor(Math.random() * 10) + 2,
            rejected: Math.floor(Math.random() * 5),
          };
        }),
        recent_activities: [
          {
            id: 'ACT-001',
            type: 'auto_approved',
            application_id: 'APP-00123',
            applicant_name: '山田太郎',
            risk_score: 45,
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            id: 'ACT-002',
            type: 'manual_approved',
            application_id: 'APP-00124',
            applicant_name: '佐藤花子',
            risk_score: 75,
            approved_by: 'staff-001',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: 'ACT-003',
            type: 'rejected',
            application_id: 'APP-00125',
            applicant_name: '鈴木一郎',
            risk_score: 85,
            rejection_reason: 'ブラックリスト一致',
            rejected_by: 'staff-002',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
        ],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
