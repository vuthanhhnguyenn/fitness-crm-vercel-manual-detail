import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  GetApplicationDetailResponse,
  GetApplicationDetailResponseSchema,
} from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/membership-applications/{id}',
  summary: 'Get membership application detail',
  description: 'Get detailed information about a specific membership application',
  tags: ['Membership Applications'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Membership application ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetApplicationDetailResponseSchema,
      description: 'Application detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Application not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// GET /api/crm/membership-applications/{id} - 詳細取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const application = db.membershipApplications.getById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const details = db.membershipApplications.getDetails(id) as Record<string, unknown>;

    const response: GetApplicationDetailResponse = {
      application: {
        ...application,
        applicant_kana: (details.applicant_kana as string) ?? 'ヤマダ タロウ',
        birth_date: (details.birth_date as string) ?? '1990/01/15',
        age: (details.age as number) ?? 36,
        gender_label: (details.gender_label as string) ?? '男性',
        phone: (details.phone as string) ?? '090-****-5678',
        phone_real: (details.phone_real as string) ?? '090-1234-5678',
        email_masked: (details.email_masked as string) ?? 'ya***@example.jp',
        email_real: (details.email_real as string) ?? 'yamada@example.jp',
        address: (details.address as string) ?? '東京都渋谷区***',
        address_real: (details.address_real as string) ?? '東京都渋谷区1-2-3',
        blacklist_conditions: (details.blacklist_conditions as string[]) ?? [],
        usage_start_date:
          (details.usage_start_date as string) ?? application.start_date.replaceAll('-', '/'),
        monthly_fee: (details.monthly_fee as number) ?? 7700,
        options: (details.options as string[]) ?? [],
        fee_rows: (details.fee_rows as { label: string; amount: number }[]) ?? [],
        payment_method: (details.payment_method as string) ?? 'クレジットカード',
        card_last4: (details.card_last4 as string) ?? '1234',
        application_source: (details.application_source as string) ?? 'アプリ',
        updated_at: (details.updated_at as string) ?? '2026/03/30 09:20',
        is_minor: application.is_minor ?? false,
        parental_consent: (details.parental_consent as boolean) ?? false,
        is_proxy: application.is_proxy ?? false,
        proxy_applicant: details.proxy_applicant as string | undefined,
        agreement_date: details.agreement_date as string | undefined,
        approved_by: details.approved_by as string | undefined,
        approved_at: details.approved_at as string | undefined,
        rejected_by: details.rejected_by as string | undefined,
        rejected_at: details.rejected_at as string | undefined,
        rejected_reason: details.rejected_reason as string | undefined,
        timeline: (details.timeline as GetApplicationDetailResponse['application']['timeline']) ?? [
          {
            id: 'tl-default-1',
            kind: 'system',
            date: '2026/03/30 09:15',
            operator: 'システム',
            content: '申請受付（アプリ経由）',
          },
        ],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching application detail:', error);
    return NextResponse.json({ error: 'Failed to fetch application detail' }, { status: 500 });
  }
}
