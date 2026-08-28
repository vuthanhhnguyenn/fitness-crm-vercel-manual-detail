'use client';

import {
  TERMS_BRAND_LABELS,
  TERMS_STATUS_BADGE_CLASSES,
  TERMS_STATUS_LABELS,
  TERMS_TYPE_LABELS,
} from '@/app/(private)/terms/_constants/constants';
import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Field } from '@/components/common/field';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { TermsDetailResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

interface ManagementInfoCardProps {
  terms: TermsDetailResponse;
}

export function ManagementInfoCard({ terms }: Readonly<ManagementInfoCardProps>) {
  const appliedVersion = terms.versions.find((version) => version.isCurrentlyApplied);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">管理情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <Field
            label="ステータス"
            value={
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 text-[10px] font-medium',
                  TERMS_STATUS_BADGE_CLASSES[terms.status],
                )}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {TERMS_STATUS_LABELS[terms.status]}
              </Badge>
            }
          />
          <Field
            label="適用中バージョン"
            value={
              appliedVersion ? (
                <Badge variant="secondary" className="text-xs">
                  {appliedVersion.version}
                </Badge>
              ) : undefined
            }
          />
          <Field label="承諾ボタン表示" value={terms.requiresConsent ? 'オン' : 'オフ'} />
          <Field label="規約タイプ" value={TERMS_TYPE_LABELS[terms.termsType]} />
          <Field
            label="ブランド"
            value={
              <Badge variant="outline" className="text-[10px]">
                {TERMS_BRAND_LABELS[terms.brandEnum]}
              </Badge>
            }
          />
          <Field label="適用開始日" value={formatDateYYYYMMDD(terms.effectiveFrom)} />
          <Field label="表示順" value={terms.displayOrder ?? undefined} />
          <div className="border-t pt-4">
            <div className="flex flex-col gap-4">
              <Field label="作成日時" value={formatDateYYYYMMDD_HHMM(terms.createdAt)} />
              <Field label="最終更新日時" value={formatDateYYYYMMDD_HHMM(terms.updatedAt)} />
              <Field label="最終更新者" value={terms.updatedBy} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
