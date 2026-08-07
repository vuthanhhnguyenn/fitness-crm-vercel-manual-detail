'use client';

import { formatDateYYYYMM_HHMMSS } from '@/utils/date.util';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

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

const statusLabels: Record<string, string> = {
  invited: '招待送信済み',
  awaiting_acceptance: '招待承諾待ち',
  declined: '招待辞退',
  expired: '招待期限切れ',
  awaiting_profile: '個人情報入力待ち',
  pending_review: '要確認',
  approved: '承認済み',
  rejected: '却下',
  completed: '入会完了',
};

export function FamilyRegistrationBasicInfoCard({
  registration,
}: Readonly<{ registration: GetCrmFamilyRegistrationsByIdResponse['registration'] }>) {
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">申請基本情報</h2>
        </div>

        <div className="mt-4 flex gap-4">
          <Avatar size="lg" className="size-16">
            <AvatarFallback>
              {registration.applicant_name?.trim()?.[0]?.toUpperCase() || 'F'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold">{registration.applicant_name}</span>
                <span className="text-muted-foreground text-sm">
                  {relationshipLabel(registration.relationship)}
                </span>
              </div>
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>主会員：{registration.primary_member_name}</span>
                <span>主会員ID：{registration.primary_member_id}</span>
                <span>店舗：{registration.store_name ?? '—'}</span>
              </div>
            </div>

            <div className="text-muted-foreground text-sm">申請ID：{registration.id}</div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                申請日時：{formatDateYYYYMM_HHMMSS(registration.created_at)}
              </span>
              <span className="text-muted-foreground">
                ステータス：{statusLabels[registration.status] || registration.status}
              </span>
              <span className="text-muted-foreground">
                招待期限：
                {registration.invite_expires_at
                  ? formatDateYYYYMM_HHMMSS(registration.invite_expires_at)
                  : '—'}
              </span>
              <span className="text-muted-foreground">
                月会費：
                {typeof registration.monthly_fee === 'number'
                  ? `${registration.monthly_fee.toLocaleString()}円`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
