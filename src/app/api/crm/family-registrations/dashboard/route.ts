import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetFamilyRegistrationsDashboardQuerySchema,
  GetFamilyRegistrationsDashboardResponseSchema,
} from '@/app/api/_schemas/family-registration.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/family-registrations/dashboard',
  summary: 'Get family registrations dashboard (A-02-02-08)',
  tags: ['Family Registrations'],
  query: GetFamilyRegistrationsDashboardQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetFamilyRegistrationsDashboardResponseSchema,
      description: 'Dashboard response',
    },
    { status: 500, schema: ErrorResponseSchema, description: 'Internal error' },
  ],
});

type Period = 'this_month' | 'last_3_months' | 'last_year';

const MEMBER_TYPE_LABELS: Record<string, string> = {
  regular: '通常会員',
  corporate: '法人会員',
  company_discount: '社割会員',
  family: '家族会員',
};
const RELATIONSHIP_LABELS: Record<string, string> = {
  spouse: '配偶者',
  child: '子',
  parent: '親',
  sibling: '兄弟',
  grandparent: '祖父母',
  grandchild: '孫',
};

function getPeriodStart(period: Period, now: Date): Date {
  const d = new Date(now);
  if (period === 'this_month') {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  } else if (period === 'last_3_months') {
    return new Date(d.getFullYear(), d.getMonth() - 3, 1);
  } else {
    return new Date(d.getFullYear() - 1, d.getMonth(), 1);
  }
}

// GET /api/crm/family-registrations/dashboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = GetFamilyRegistrationsDashboardQuerySchema.safeParse({
    period: searchParams.get('period') ?? undefined,
  });
  const period: Period = parsed.success ? parsed.data.period : 'this_month';
  const now = new Date();
  const periodStart = getPeriodStart(period, now);

  // ── Seed ────────────────────────────────────────────────────
  db.members._seed();
  db.family._seed();

  const allRows = db.family.listRegistrations();
  const periodRows = allRows.filter((r) => new Date(r.created_at) >= periodStart);

  // ── サマリカード: month_completed ───────────────────────────
  const month_completed = periodRows.filter(
    (r) => r.status === 'completed' || r.status === 'approved',
  ).length;

  // ── サマリカード: family_member_ratio ────────────────────────
  const activeMembers = db.members._members.filter((m) => m.profile.status === 'active');
  const totalActiveMembers = activeMembers.length;
  const familyActiveMembers = activeMembers.filter(
    (m) => m.profile.member_type === 'family',
  ).length;
  const family_member_ratio =
    totalActiveMembers > 0
      ? Math.round((familyActiveMembers / totalActiveMembers) * 1000) / 1000
      : 0.25;

  // ── サマリカード: avg_children_per_primary ───────────────────
  // Read from _relationships (actual linked members), not registration rows.
  const primaryCountMap = new Map<string, number>();
  for (const [primaryId, rels] of db.family._relationships) {
    if (rels.length > 0) primaryCountMap.set(primaryId, rels.length);
  }
  const totalChildren = [...primaryCountMap.values()].reduce((s, v) => s + v, 0);
  const avg_children_per_primary =
    primaryCountMap.size > 0 ? Math.round((totalChildren / primaryCountMap.size) * 100) / 100 : 0;

  // ── サマリカード: auto_approval_rate ─────────────────────────
  // Registrations without a risk_reason are considered auto-approved.
  const closedRows = periodRows.filter((r) =>
    ['approved', 'completed', 'rejected'].includes(r.status),
  );
  const autoApprovedCount = closedRows.filter((r) => !r.risk_reason).length;
  const auto_approval_rate =
    closedRows.length > 0 ? Math.round((autoApprovedCount / closedRows.length) * 1000) / 1000 : 0;

  // ── グラフ: monthly_trend (completed + approved per month) ───
  const numMonths = period === 'last_year' ? 12 : 6;
  const monthly_trend = Array.from({ length: numMonths }, (_, i) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1 - i), 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
    const count = allRows.filter((r) => {
      const rd = new Date(r.created_at);
      return (
        rd >= monthStart && rd < monthEnd && (r.status === 'completed' || r.status === 'approved')
      );
    }).length;
    return { month: monthKey, count };
  });

  // ── グラフ: by_member_type ────────────────────────────────────
  // Count family members grouped by primary member's member_type.
  const memberTypeCounts: Record<string, number> = {};
  for (const [primaryId, rels] of db.family._relationships) {
    if (rels.length === 0) continue;
    const primary = db.members.get(primaryId);
    const mt = primary?.profile.member_type ?? 'regular';
    memberTypeCounts[mt] = (memberTypeCounts[mt] ?? 0) + rels.length;
  }
  const totalTyped = Object.values(memberTypeCounts).reduce((s, v) => s + v, 0);
  const by_member_type = Object.entries(memberTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mt, count]) => ({
      member_type: mt,
      label: MEMBER_TYPE_LABELS[mt] ?? mt,
      count,
      ratio: totalTyped > 0 ? Math.round((count / totalTyped) * 1000) / 1000 : 0,
    }));

  // ── グラフ: family_size_distribution ─────────────────────────
  // Distribution of primaries by how many family members they have.
  const sizeDist: Record<string, number> = { '1名': 0, '2名': 0, '3名以上': 0 };
  for (const rels of db.family._relationships.values()) {
    if (rels.length === 1) sizeDist['1名']++;
    else if (rels.length === 2) sizeDist['2名']++;
    else if (rels.length >= 3) sizeDist['3名以上']++;
  }
  const family_size_distribution = Object.entries(sizeDist).map(([label, count]) => ({
    label,
    count,
  }));

  // ── グラフ: by_relationship ───────────────────────────────────
  // Count each relationship type across all linked family members.
  const relCounts: Record<string, number> = {};
  for (const rels of db.family._relationships.values()) {
    for (const r of rels) {
      relCounts[r.relationship] = (relCounts[r.relationship] ?? 0) + 1;
    }
  }
  const by_relationship = Object.entries(relCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([rel, count]) => ({
      relationship: rel,
      label: RELATIONSHIP_LABELS[rel] ?? rel,
      count,
    }));

  // ── 主会員分析: top_primary_members ──────────────────────────
  const top_primary_members = [...primaryCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => {
      const member = db.members.get(id);
      return {
        primary_member_id: id,
        primary_member_name: member?.basic_info.name_kanji ?? `会員 ${id}`,
        family_count: count,
      };
    });

  // ── 主会員分析: avg_usage_comparison ─────────────────────────
  const avg_usage_comparison = {
    family_member: Math.round((7 + (familyActiveMembers % 4)) * 10) / 10,
    regular_member: Math.round((5 + (totalActiveMembers % 3)) * 10) / 10,
  };

  return NextResponse.json({
    period,
    // サマリカード
    month_completed,
    family_member_ratio,
    avg_children_per_primary,
    auto_approval_rate,
    // グラフ
    monthly_trend,
    by_member_type,
    family_size_distribution,
    by_relationship,
    // 主会員分析
    top_primary_members,
    avg_usage_comparison,
  });
}
