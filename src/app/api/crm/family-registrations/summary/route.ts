import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetFamilyRegistrationsSummaryQuerySchema,
  GetFamilyRegistrationsSummaryResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/family-registrations/summary',
  summary: 'Get family registrations summary',
  tags: ['Family Registrations'],
  query: GetFamilyRegistrationsSummaryQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetFamilyRegistrationsSummaryResponseSchema,
      description: 'Summary response',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal error' },
  ],
});

// GET /api/crm/family-registrations/summary
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = GetFamilyRegistrationsSummaryQuerySchema.safeParse({
    period: searchParams.get('period') ?? undefined,
  });
  const period = parsed.success ? parsed.data.period : 'this_month';

  const allRows = db.family.listRegistrations();

  // ── フィルタ期間の開始日を算出 ─────────────────────────────
  const now = new Date();

  const periodRows = (() => {
    if (period === 'all') return allRows;

    const startOf = new Date(now);
    if (period === 'this_month') {
      startOf.setDate(1);
      startOf.setHours(0, 0, 0, 0);
    } else {
      // this_week: 月曜日を週の開始とする
      const day = startOf.getDay(); // 0=日, 1=月...
      const diffToMonday = day === 0 ? -6 : 1 - day;
      startOf.setDate(startOf.getDate() + diffToMonday);
      startOf.setHours(0, 0, 0, 0);
    }
    return allRows.filter((r) => new Date(r.created_at) >= startOf);
  })();

  // ── ステータス別件数（全件・タブ表示用）────────────────────
  // by_status counts ALL registrations regardless of period so tab badges
  // always reflect the real totals. Period filter only affects summary KPIs.
  const ALL_STATUSES = [
    'awaiting_acceptance',
    'awaiting_profile',
    'pending_review',
    'approved',
    'rejected',
    'completed',
    'declined',
    'expired',
    'invited',
  ] as const;

  const by_status: Record<string, number> = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]));
  for (const r of allRows) {
    by_status[r.status] = (by_status[r.status] ?? 0) + 1;
  }

  // ── 今月のサマリ指標（期間フィルタ適用）─────────────────
  const total_invites = periodRows.length;
  const total_completed = periodRows.filter(
    (r) => r.status === 'completed' || r.status === 'approved',
  ).length;

  // 家族会員比率 = 有効な家族会員数 / 有効な全会員数
  db.members._seed();
  const activeMembers = db.members._members.filter((m) => m.profile.status === 'active');
  const totalActiveMembers = activeMembers.length;
  const familyActiveMembers = activeMembers.filter(
    (m) => m.profile.member_type === 'family',
  ).length;
  const family_member_ratio =
    totalActiveMembers > 0
      ? Math.round((familyActiveMembers / totalActiveMembers) * 1000) / 1000
      : 0;

  // 招待承諾率 = (承諾以降のステータス) / 総招待数
  const acceptedStatuses = ['awaiting_profile', 'pending_review', 'approved', 'completed'];
  const acceptedCount = periodRows.filter((r) => acceptedStatuses.includes(r.status)).length;
  const acceptance_rate =
    total_invites > 0 ? Math.round((acceptedCount / total_invites) * 1000) / 1000 : 0;

  // ── 親会員別統計: _relationships から実際の家族会員数をカウント ──────────
  db.family._seed();
  const primaryCountMap = new Map<string, number>();
  for (const [primaryId, rels] of db.family._relationships) {
    if (rels.length > 0) {
      primaryCountMap.set(primaryId, rels.length);
    }
  }

  // TOP10（子会員数の多い順）
  const top_primary_members = [...primaryCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => {
      const primary = db.members.get(id);
      return {
        primary_member_id: id,
        primary_member_name: primary?.basic_info.name_kanji ?? '',
        family_count: count,
      };
    });

  // 子会員の平均人数
  const totalChildren = [...primaryCountMap.values()].reduce((sum, v) => sum + v, 0);
  const avg_children_per_primary =
    primaryCountMap.size > 0 ? Math.round((totalChildren / primaryCountMap.size) * 100) / 100 : 0;

  return NextResponse.json({
    period,
    total_invites,
    total_completed,
    family_member_ratio,
    acceptance_rate,
    by_status,
    top_primary_members,
    avg_children_per_primary,
    total: allRows.length,
  });
}
