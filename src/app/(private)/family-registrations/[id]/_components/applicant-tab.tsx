'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { GetCrmFamilyRegistrationsByIdResponse } from '@/lib/api/types.gen';

const relationshipLabel = (
  rel?: GetCrmFamilyRegistrationsByIdResponse['registration']['relationship'],
) => {
  switch (rel) {
    case 'spouse':
      return '配偶者';
    case 'child':
      return '子';
    case 'parent':
      return '親';
    case 'sibling':
      return '兄弟';
    case 'grandparent':
      return '祖父母';
    case 'grandchild':
      return '孫';
    default:
      return '—';
  }
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="text-muted-foreground text-sm font-medium">{label}</label>
      <p className="mt-1 text-sm">{value || '—'}</p>
    </div>
  );
}

export function ApplicantTab({
  registration,
}: Readonly<{ registration: GetCrmFamilyRegistrationsByIdResponse['registration'] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>申請者情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本情報 */}
        <div>
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            基本情報
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="氏名" value={registration.applicant_name} />
            <InfoRow label="性別" value={null} />
            <InfoRow label="生年月日" value={registration.applicant?.birthday} />
            <InfoRow
              label="主会員との関係性"
              value={relationshipLabel(registration.relationship)}
            />
          </div>
        </div>

        <Separator />

        {/* 連絡先 */}
        <div>
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            連絡先
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="メールアドレス" value={registration.applicant?.email} />
            <InfoRow label="電話番号" value={registration.applicant?.phone} />
            <div className="sm:col-span-2">
              <InfoRow label="住所" value={null} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
