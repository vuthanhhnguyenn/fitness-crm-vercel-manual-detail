'use client';

import { formatDateYYYYMM_HHMMSS } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { GetCrmFamilyRegistrationsByIdResponse } from '@/lib/api/types.gen';

const memberTypeLabel = (type?: string) => {
  switch (type) {
    case 'regular':
      return '通常会員';
    case 'family':
      return '家族会員';
    case 'corporate':
      return '法人会員';
    default:
      return type ?? '—';
  }
};

// const statusLabel = (status?: string) => {
//   switch (status) {
//     case 'active':
//       return '在籍中';
//     case 'suspended':
//       return '休会中';
//     case 'withdrawn':
//       return '退会済み';
//     default:
//       return status ?? '—';
//   }
// };

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="text-muted-foreground text-sm font-medium">{label}</label>
      <p className="mt-1 text-sm">{value ?? '—'}</p>
    </div>
  );
}

export function PrimaryMemberTab({
  registration,
}: Readonly<{ registration: GetCrmFamilyRegistrationsByIdResponse['registration'] }>) {
  const pm = registration.primary_member;

  const tenureLabel =
    pm?.tenure_months != null
      ? pm.tenure_months >= 12
        ? `${Math.floor(pm.tenure_months / 12)}年${pm.tenure_months % 12}ヶ月`
        : `${pm.tenure_months}ヶ月`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>主会員情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本情報 */}
        <div>
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            基本情報
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="氏名" value={registration.primary_member_name} />
            <InfoRow label="会員番号" value={pm?.member_number} />
            <InfoRow label="会員種別" value={memberTypeLabel(pm?.member_type)} />
            {/* <InfoRow label="ステータス" value={statusLabel(pm?.status)} /> */}
          </div>
        </div>

        <Separator />

        {/* 在籍情報 */}
        <div>
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            在籍情報
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              label="入会日"
              value={pm?.joined_at ? formatDateYYYYMM_HHMMSS(pm.joined_at) : null}
            />
            <InfoRow label="在籍期間" value={tenureLabel} />
            <InfoRow
              label="家族会員数（現在 / 上限）"
              value={
                pm?.family_member_count != null && pm?.family_member_limit != null
                  ? `${pm.family_member_count} / ${pm.family_member_limit}`
                  : null
              }
            />
          </div>
        </div>

        <Separator />

        {/* リスク情報 */}
        <div>
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            リスク情報
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              label="未納金の有無"
              value={pm?.has_unpaid == null ? null : pm.has_unpaid ? 'あり' : 'なし'}
            />
            <InfoRow
              label="過去の未納歴"
              value={pm?.has_past_unpaid == null ? null : pm.has_past_unpaid ? 'あり' : 'なし'}
            />
            <InfoRow
              label="過去の強制退会歴"
              value={
                pm?.has_forced_withdrawal == null
                  ? null
                  : pm.has_forced_withdrawal
                    ? 'あり'
                    : 'なし'
              }
            />
            <InfoRow
              label="月間利用回数"
              value={pm?.monthly_usage_count != null ? `${pm.monthly_usage_count}回` : null}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
