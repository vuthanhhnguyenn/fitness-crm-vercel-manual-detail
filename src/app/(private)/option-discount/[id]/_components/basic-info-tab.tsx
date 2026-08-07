'use client';

import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Percent } from 'lucide-react';

import { Field } from '@/components/common/field';
import { StatusCard } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmOptionDiscountsByIdResponse } from '@/lib/api/types.gen';
import { OptionDiscountStatus, OptionDiscountType } from '@/lib/api/types.gen';

import {
  OPTION_DISCOUNT_CONDITION_LABELS,
  OPTION_DISCOUNT_STATUS_LABELS,
  OPTION_DISCOUNT_TYPE_BADGE_CLASSES,
  OPTION_DISCOUNT_TYPE_LABELS,
  formatOptionDiscountValue,
} from '../../_constants/constants';

type OptionDiscountDetail = NonNullable<GetCrmOptionDiscountsByIdResponse>['option_discount'];

interface BasicInfoTabProps {
  data: OptionDiscountDetail;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function BasicInfoTab({ data }: BasicInfoTabProps) {
  const isActive = data.status === OptionDiscountStatus.ACTIVE;
  const discountLabel = formatOptionDiscountValue(data.discount_type, data.discount_value);

  return (
    <div className="flex gap-4">
      <div className="flex w-[60%] flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow label="セット割ID" value={data.id} />
              <InfoRow label="セット割名" value={data.name} />
              <InfoRow label="コード" value={data.code} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">対象商品</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-muted-foreground mb-2 text-xs">対象契約</p>
                <div className="flex flex-wrap gap-2">
                  {data.target_contracts.map((contract) => (
                    <Badge key={contract} variant="outline" className="text-xs">
                      {contract}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-xs">対象オプション</p>
                <div className="flex flex-wrap gap-2">
                  {data.target_options.map((option) => (
                    <Badge key={option} variant="outline" className="text-xs">
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">割引設定</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">割引タイプ</p>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${OPTION_DISCOUNT_TYPE_BADGE_CLASSES[data.discount_type]}`}
                >
                  {OPTION_DISCOUNT_TYPE_LABELS[data.discount_type]}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">割引額</p>
                <p className="text-sm font-medium">
                  {discountLabel}
                  {data.discount_type === OptionDiscountType.FIXED_AMOUNT && (
                    <span className="text-muted-foreground ml-1 text-xs font-normal">/ 月</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">適用条件</p>
                <p className="text-sm font-medium">
                  {OPTION_DISCOUNT_CONDITION_LABELS[data.conditions] ?? data.conditions}
                </p>
              </div>
            </div>
            {data.description && (
              <>
                <div className="mt-4 border-t pt-4">
                  <p className="text-muted-foreground mb-1 text-xs">説明</p>
                  <p className="text-muted-foreground text-sm">{data.description}</p>
                </div>
              </>
            )}
            {data.rules.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-xs">適用ルール</p>
                <ul className="flex flex-col gap-2">
                  {data.rules.map((rule, idx) => (
                    <li key={idx} className="text-muted-foreground flex items-start gap-2 text-xs">
                      <span className="text-foreground">&bull;</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <StatusCard
            tone={isActive ? 'success' : 'muted'}
            icon={Percent}
            label={OPTION_DISCOUNT_STATUS_LABELS[data.status]}
            meta={isActive ? `${formatDateYYYYMMDD(data.updated_at)} より有効` : undefined}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">適用状況</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">適用会員数</span>
                  <span className="text-sm font-semibold">
                    {data.applied_count.toLocaleString()}名
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">その他情報</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-4">
                <Field label="作成日時" value={formatDateYYYYMMDD_HHMM(data.created_at)} />
                <Field label="最終更新日時" value={formatDateYYYYMMDD_HHMM(data.updated_at)} />
                <Field label="更新者" value={data.updated_by} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
