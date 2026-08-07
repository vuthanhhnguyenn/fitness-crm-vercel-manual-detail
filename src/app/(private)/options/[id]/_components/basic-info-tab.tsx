'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Crown, Package, Store } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { Field } from '@/components/common/field';
import { StatusCard } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmOptionsByIdResponse } from '@/lib/api/types.gen';
import { Brand, OptionStatus, OptionType } from '@/lib/api/types.gen';

import {
  OPTION_STATUS_LABELS,
  OPTION_TYPE_BADGE_CLASSES,
  OPTION_TYPE_LABELS,
  OPTION_USAGE_RULE_LABELS,
} from '../../_constants/constants';

type OptionDetail = NonNullable<GetCrmOptionsByIdResponse>['option'];

const PRORATA_METHOD_LABELS = {
  daily: '日割り計算',
  fixed: '固定金額',
} as const;

interface BasicInfoTabProps {
  option: OptionDetail;
}

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`;
}

export function BasicInfoTab({ option }: BasicInfoTabProps) {
  const isActive = option.status === OptionStatus.ACTIVE;

  return (
    <div className="flex items-start gap-4">
      <div className="flex w-[60%] flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="オプションID" value={option.id} mono />
              <Field label="オプション名" value={option.name} />
              <Field label="コード" value={option.code} mono />
              <Field label="ブランド" value={<BrandBadge brand={option.brand as Brand} />} />
              <Field
                label="対象店舗範囲"
                value={
                  <div className="flex items-center gap-2">
                    <Store className="text-muted-foreground size-4" />
                    <span>{option.store_range}</span>
                  </div>
                }
              />
              <Field label="備考" value={option.note ?? '―'} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">料金情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="月額料金" value={formatPrice(option.price_excluding_tax)} />
              <Field label="税率" value={`${option.tax_rate}%`} />
              <Field label="税込金額" value={formatPrice(option.price_including_tax)} />
              <Field label="会計コード" value={option.accounting_code} mono />
              <Field
                label="日割り要否"
                value={option.prorated_enabled ? '適用する' : '適用しない'}
              />
              <Field
                label="日割り計算方式"
                value={
                  option.prorated_enabled && option.prorata_method
                    ? PRORATA_METHOD_LABELS[option.prorata_method]
                    : '―'
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">オプション種別・利用可否</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field
                label="オプション種別"
                value={
                  <Badge
                    variant="outline"
                    className={`text-xs font-normal ${OPTION_TYPE_BADGE_CLASSES[option.option_type as OptionType]}`}
                  >
                    {OPTION_TYPE_LABELS[option.option_type as OptionType]}
                  </Badge>
                }
              />
              <Field label="都次オプション種別" value={option.tsuji_type ?? '―'} />
              <Field label="利用可否ルール" value={OPTION_USAGE_RULE_LABELS[option.usage_rule]} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">制約設定・エリア制限</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field
                label="主オプション契約変更可否"
                value={option.constraint_main_option_change ? '可' : '不可'}
              />
              <Field label="変更可否" value={option.constraint_change ? '可' : '不可'} />
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">エリア制限</span>
                {option.area_restrictions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {option.area_restrictions.map((area) => (
                      <Badge key={area} variant="outline" className="text-xs font-normal">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">制限なし</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {option.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">説明</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-sm leading-relaxed">{option.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="w-[40%]">
        <div className="sticky top-6 flex flex-col gap-4">
          <StatusCard
            tone={isActive ? 'success' : 'muted'}
            icon={Package}
            label={OPTION_STATUS_LABELS[option.status as OptionStatus]}
            meta={[
              `作成: ${formatDateYYYYMMDD_HHMM(option.created_at)}`,
              `更新: ${formatDateYYYYMMDD_HHMM(option.updated_at)}`,
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">利用状況</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">利用会員数</span>
                  <span className="text-sm font-semibold">
                    {option.member_count.toLocaleString()}名
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">紐付け契約数</span>
                  <span className="text-sm font-semibold">{option.linked_contracts}件</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">人気ランキング</span>
                  <div className="flex items-center gap-1">
                    <Crown className="text-warning size-4" />
                    <span className="text-sm font-semibold">
                      {option.popularity_rank ? `${option.popularity_rank}位` : '―'}
                    </span>
                  </div>
                </div>
                <div className="text-muted-foreground border-t pt-2 text-xs">
                  現在の利用状況をもとに表示しています。
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
                <Field label="作成日時" value={formatDateYYYYMMDD_HHMM(option.created_at)} />
                <Field label="更新日時" value={formatDateYYYYMMDD_HHMM(option.updated_at)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
