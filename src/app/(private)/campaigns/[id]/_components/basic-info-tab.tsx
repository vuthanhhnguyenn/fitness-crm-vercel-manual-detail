'use client';

import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { ArrowRight, Link2, Link2Off } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { SummaryCard } from '@/components/common/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { CampaignDetailResponse, CampaignDiscountType } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import {
  CAMPAIGN_APPLY_START_MONTH_LABELS,
  CAMPAIGN_ENABLED_BADGE_CLASS,
  CAMPAIGN_INFO_BADGE_CLASS,
  CAMPAIGN_TARGET_SEX_BADGE_CLASSES,
  CAMPAIGN_TARGET_SEX_LABELS,
} from '../../_constants/constants';
import { CampaignAcceptancePanel } from './campaign-acceptance-panel';

const DASH = '—';

function Field({
  label,
  children,
  className,
}: Readonly<{ label: string; children: ReactNode; className?: string }>) {
  return (
    <div className={className}>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {children}
    </div>
  );
}

function TextValue({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-sm font-medium">{children}</p>;
}

function formatDiscount(type: CampaignDiscountType | null, value: number | null): string {
  if (type === null || value === null) return 'なし';
  return type === 'percentage' ? `${value}%OFF` : `${value.toLocaleString()}円引き`;
}

/** 初月・翌月は別の値を持てるため、有効な月ごとに分けて表示する。 */
function formatOptionDiscount(
  entry: CampaignDetailResponse['campaignOptionDiscounts'][number],
): string {
  const segments = [
    entry.discountMonth1
      ? `初月 ${formatDiscount(entry.discountMonth1Type, entry.discountMonth1Value)}`
      : null,
    entry.discountMonth2
      ? `翌月 ${formatDiscount(entry.discountMonth2Type, entry.discountMonth2Value)}`
      : null,
  ].filter((segment): segment is string => segment !== null);
  return segments.length > 0 ? segments.join('・') : 'なし';
}

function applyStartMonthText(campaign: CampaignDetailResponse): string {
  if (campaign.applyStartMonth === null) return DASH;
  if (campaign.applyStartMonth === 'specific_month') {
    return `${campaign.applyStartSpecificN ?? '?'}ヶ月目から`;
  }
  return CAMPAIGN_APPLY_START_MONTH_LABELS[campaign.applyStartMonth];
}

export function BasicInfoTab({ campaign }: Readonly<{ campaign: CampaignDetailResponse }>) {
  const router = useRouter();
  const { stats } = campaign;
  const remaining =
    campaign.entryCap === null
      ? null
      : Math.max(0, campaign.entryCap - stats.pendingApplicationCount);

  const planDiscountFirst = campaign.planDiscountMonth1
    ? formatDiscount(campaign.planDiscountMonth1Type, campaign.planDiscountMonth1Value)
    : 'なし';
  const planDiscountSecond = campaign.planDiscountMonth2
    ? formatDiscount(campaign.planDiscountMonth2Type, campaign.planDiscountMonth2Value)
    : 'なし';

  const conditionalSexes =
    campaign.campaignAutoOptions.find((entry) => entry.targetSexes !== null)?.targetSexes ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          title="適用会員数"
          value={stats.appliedMemberCount.toLocaleString()}
          suffix="名"
        />
        <SummaryCard
          title="申請数"
          value={stats.pendingApplicationCount.toLocaleString()}
          suffix="件"
          tone="info"
        />
        <SummaryCard
          title="今月の新規適用"
          value={stats.monthlyNewApplicationCount.toLocaleString()}
          suffix="名"
          tone="success"
        />
      </div>

      <Card className="py-0">
        <div className="flex items-center gap-4 px-4 py-3">
          <p className="text-muted-foreground text-xs font-semibold">入会経路別内訳</p>
          <div className="text-muted-foreground text-xs">
            モバイル:{' '}
            <span className="text-foreground font-semibold">
              {stats.enrollmentChannels.mobile}名
            </span>
          </div>
          <span className="text-border">|</span>
          <div className="text-muted-foreground text-xs">
            手動:{' '}
            <span className="text-foreground font-semibold">
              {stats.enrollmentChannels.manual}名
            </span>
          </div>
          <span className="text-border">|</span>
          <div className="text-muted-foreground text-xs">
            紹介経由:{' '}
            <span className="text-foreground font-semibold">
              {stats.enrollmentChannels.referral}名
            </span>
          </div>
          <p className="text-muted-foreground ml-auto text-xs">
            適用会員数 {stats.appliedMemberCount}名の内訳
          </p>
        </div>
      </Card>

      <div className="flex gap-4">
        {/* Left column (60%) */}
        <div className="flex w-[60%] flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="キャンペーンID">
                  <TextValue>{campaign.id}</TextValue>
                </Field>
                <Field label="キャンペーン名" className="min-w-0">
                  <p className="truncate text-sm font-medium" title={campaign.name}>
                    {campaign.name}
                  </p>
                </Field>
                <Field label="キャンペーンコード">
                  {campaign.campaignCode ? (
                    <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                      {campaign.campaignCode}
                    </code>
                  ) : (
                    <TextValue>{DASH}</TextValue>
                  )}
                </Field>
                <Field label="ブランド">
                  <BrandBadge brand={campaign.brandEnum} />
                </Field>
                <Field label="公開店舗">
                  {campaign.publishScope === 'all_stores' ? (
                    <Badge variant="outline" className="text-xs">
                      全店舗に公開
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={cn('text-xs', CAMPAIGN_INFO_BADGE_CLASS)}>
                        特定店舗のみ
                      </Badge>
                      {campaign.publishStores.map((store) => (
                        <Badge key={store.storeId} variant="outline" className="text-xs">
                          {store.storeName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="先着件数上限">
                  <TextValue>
                    {campaign.entryCap === null
                      ? DASH
                      : `先着${campaign.entryCap}件（残り${remaining}件）`}
                  </TextValue>
                </Field>
                <Field label="備考" className="col-span-2">
                  <p className="text-sm">{campaign.remarks ?? DASH}</p>
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">割引設定</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="月額割引（初月）">
                  <TextValue>{planDiscountFirst}</TextValue>
                </Field>
                <Field label="月額割引（翌月）">
                  <TextValue>{planDiscountSecond}</TextValue>
                </Field>
                <Field label="オプション割引" className="col-span-2">
                  {campaign.campaignOptionDiscounts.length === 0 ? (
                    <TextValue>なし</TextValue>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {campaign.campaignOptionDiscounts.map((entry) => (
                        <p key={entry.optionId} className="text-sm">
                          <span className="font-medium">{entry.optionName}</span>
                          <span className="text-muted-foreground">
                            {' / '}
                            {formatOptionDiscount(entry)}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">適用条件</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="対象契約" className="col-span-2">
                  {campaign.conditionOptions.length === 0 ? (
                    <TextValue>{DASH}</TextValue>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {campaign.conditionOptions.map((option) => (
                        <Badge key={option.optionId} variant="outline" className="text-xs">
                          {option.optionName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="適用主契約">
                  <Badge variant="outline" className="text-xs">
                    {campaign.planName}
                  </Badge>
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">期間設定</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold">募集期間</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <Field label="開始日">
                      <TextValue>{formatDateYYYYMMDD(campaign.recruitmentStart)}</TextValue>
                    </Field>
                    <Field label="終了日">
                      <TextValue>{formatDateYYYYMMDD(campaign.recruitmentEnd)}</TextValue>
                    </Field>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold">利用開始期間</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <Field label="開始日">
                      <TextValue>
                        {campaign.usageStart ? formatDateYYYYMMDD(campaign.usageStart) : DASH}
                      </TextValue>
                    </Field>
                    <Field label="終了日">
                      <TextValue>
                        {campaign.usageEnd ? formatDateYYYYMMDD(campaign.usageEnd) : DASH}
                      </TextValue>
                    </Field>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold">
                    キャンペーン適用期間
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <Field label="適用開始月">
                      <TextValue>{applyStartMonthText(campaign)}</TextValue>
                    </Field>
                    <Field label="適用期間">
                      <TextValue>
                        {campaign.applyDurationMonths === null
                          ? DASH
                          : `${campaign.applyDurationMonths}ヶ月（利用開始日起算）`}
                      </TextValue>
                    </Field>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold">
                    縛り期間（解約手数料期間）
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <Field label="期間">
                      <TextValue>
                        {campaign.lockInMonths === null ? DASH : `${campaign.lockInMonths}ヶ月`}
                      </TextValue>
                    </Field>
                    <Field label="適用例">
                      <TextValue>{campaign.lockInExample ?? DASH}</TextValue>
                    </Field>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    JOYFIT自動移籍判定でこの値が参照されます
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">自動付与設定</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="自動付与">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      campaign.campaignAutoOptions.length > 0 && CAMPAIGN_ENABLED_BADGE_CLASS,
                    )}
                  >
                    {campaign.campaignAutoOptions.length > 0 ? 'あり' : 'なし'}
                  </Badge>
                </Field>
                <Field label="付与対象">
                  <TextValue>{conditionalSexes.length > 0 ? '条件あり' : '全員'}</TextValue>
                </Field>
                <Field label="性別条件">
                  {conditionalSexes.length === 0 ? (
                    <TextValue>{DASH}</TextValue>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {conditionalSexes.map((sex) => (
                        <Badge
                          key={sex}
                          variant="outline"
                          className={cn('text-xs', CAMPAIGN_TARGET_SEX_BADGE_CLASSES[sex])}
                        >
                          {CAMPAIGN_TARGET_SEX_LABELS[sex]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="付与オプション">
                  {campaign.campaignAutoOptions.length === 0 ? (
                    <TextValue>{DASH}</TextValue>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {campaign.campaignAutoOptions.map((entry) => (
                        <Badge key={entry.optionId} variant="outline" className="text-xs">
                          {entry.optionName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">紹介キャンペーン特典</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <Field label="友達紹介連動">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      campaign.referral.enabled && CAMPAIGN_ENABLED_BADGE_CLASS,
                    )}
                  >
                    {campaign.referral.enabled ? 'あり' : 'なし'}
                  </Badge>
                </Field>
                <Field label="紹介者へのポイント付与">
                  <TextValue>
                    {campaign.referral.points === null
                      ? DASH
                      : `${campaign.referral.points.toLocaleString()}pt / 紹介成立ごと`}
                  </TextValue>
                </Field>
                <Field label="段階的増加">
                  <TextValue>
                    {campaign.referral.tieredIncrease
                      ? `あり（${campaign.referral.tierThreshold ?? '?'}人目以降 ${(
                          campaign.referral.tierPoints ?? 0
                        ).toLocaleString()}pt）`
                      : 'なし'}
                  </TextValue>
                </Field>
                <Field label="ポイントリセット">
                  <TextValue>
                    {campaign.referral.annualReset ? '毎年3/31にリセット' : 'リセットなし'}
                  </TextValue>
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column (40%) */}
        <div className="w-[40%]">
          <div className="sticky top-0 flex flex-col gap-4">
            <CampaignAcceptancePanel campaign={campaign} />

            {/* 店舗での利用は参照専用。操作の正は店舗管理の契約・料金タブ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">店舗での利用</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="flex flex-col gap-3">
                  <Field label={`利用店舗（${campaign.storeCount}店舗）`}>
                    {campaign.storeUsages.length === 0 ? (
                      <div className="flex items-center gap-2">
                        <Link2Off className="text-muted-foreground size-4" />
                        <p className="text-sm font-medium">未利用</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {campaign.storeUsages.map((usage) => (
                          <div key={usage.storeId} className="flex items-center gap-2">
                            <Link2 className="text-muted-foreground size-4" />
                            <p className="text-sm font-medium">{usage.storeName}</p>
                            <span className="text-muted-foreground text-xs">
                              {formatDateYYYYMMDD(usage.linkedAt)} 紐づけ
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                  <p className="text-muted-foreground text-xs">
                    利用設定は店舗管理の契約・料金タブで行います
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto w-fit p-0 text-xs"
                    onClick={() => router.push(navigate('/stores'))}
                  >
                    店舗管理で設定
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">その他情報</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="flex flex-col gap-4">
                  <Field label="作成日時">
                    <p className="text-sm">{formatDateYYYYMMDD_HHMM(campaign.createdAt)}</p>
                  </Field>
                  <Field label="更新日時">
                    <p className="text-sm">{formatDateYYYYMMDD_HHMM(campaign.updatedAt)}</p>
                  </Field>
                  <Field label="作成者">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted flex size-6 items-center justify-center rounded-full text-[10px] font-medium">
                        {(campaign.createdBy ?? DASH).slice(0, 1)}
                      </div>
                      <p className="text-sm">{campaign.createdBy ?? DASH}</p>
                    </div>
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
