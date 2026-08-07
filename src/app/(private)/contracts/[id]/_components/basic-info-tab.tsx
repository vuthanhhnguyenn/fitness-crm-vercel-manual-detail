'use client';

import Image from 'next/image';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Check, ImageIcon, Network } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { Field } from '@/components/common/field';
import { StatusCard } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { GetCrmMainContractsByIdResponse } from '@/lib/api/types.gen';
import { Brand, MainContractStatus, MainContractType } from '@/lib/api/types.gen';

import {
  MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS,
  MAIN_CONTRACT_STATUS_LABELS,
  MAIN_CONTRACT_TYPE_BADGE_CLASSES,
  MAIN_CONTRACT_TYPE_LABELS,
} from '../../_constants/constants';

type ContractDetail = NonNullable<GetCrmMainContractsByIdResponse>['main_contract'];

interface BasicInfoTabProps {
  contract: ContractDetail;
}

export function BasicInfoTab({ contract }: BasicInfoTabProps) {
  const isActive = contract.status === MainContractStatus.ACTIVE;

  return (
    <div className="flex items-start gap-4">
      {/* Left (60%) */}
      <div className="flex w-[60%] flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="主契約ID" value={contract.id} mono />
              <Field label="主契約名" value={contract.name} />
              <Field label="コード" value={contract.code} mono />
              <Field label="旧コード" value={contract.old_code ?? '―'} mono />
              <Field
                label="契約タイプ"
                value={
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${MAIN_CONTRACT_TYPE_BADGE_CLASSES[contract.contract_type as MainContractType] ?? ''}`}
                  >
                    {MAIN_CONTRACT_TYPE_LABELS[contract.contract_type as MainContractType] ??
                      contract.contract_type}
                  </Badge>
                }
              />
              <Field label="ブランド" value={<BrandBadge brand={contract.brand as Brand} />} />
              <Field label="対象店舗範囲" value={contract.store_range} />
              <Field
                label="他店舗利用可否"
                value={
                  MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS[
                    contract.other_store_usage as keyof typeof MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS
                  ] ?? contract.other_store_usage
                }
              />
              <Field label="主契約変更可否" value={contract.changeability} />
              <Field
                label="同伴特典"
                value={
                  contract.companion_benefit_enabled ? (
                    <Badge
                      variant="outline"
                      className="border-success/20 bg-success/15 text-success text-[10px]"
                    >
                      あり
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">なし</span>
                  )
                }
              />
              <Field label="変更前主契約" value={contract.previous_contract ?? '―'} />
              <Field
                label="現在の契約者数"
                value={`${contract.active_contracts.toLocaleString()}名`}
              />
            </div>
          </CardContent>
        </Card>

        {contract.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">説明</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-sm leading-relaxed">{contract.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">会員公開設定</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-6">
              <Field label="会員公開用主契約名" value={contract.public_name} />
              <Field label="企業" value={contract.company ?? '―'} />
              <Field label="規約" value={contract.regulation ?? '―'} />
            </div>
            <div className="mt-4">
              <Label className="text-muted-foreground text-xs">説明文</Label>
              <p className="mt-1 text-sm leading-relaxed">{contract.public_description}</p>
            </div>
            <div className="mt-4">
              <Label className="text-muted-foreground text-xs">サムネイル画像</Label>
              {contract.thumbnail_url ? (
                <Image
                  src={contract.thumbnail_url}
                  alt="サムネイル"
                  fill
                  className="object-cover"
                  sizes="160px"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="bg-muted/50 mt-2 flex h-24 w-40 items-center justify-center rounded-md border border-dashed">
                  <div className="text-muted-foreground flex flex-col items-center gap-1">
                    <ImageIcon className="size-5" />
                    <span className="text-[10px]">未設定</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right (40%) */}
      <div className="w-[40%]">
        <div className="sticky top-6 flex flex-col gap-4">
          <StatusCard
            tone={isActive ? 'success' : 'muted'}
            icon={Check}
            label={
              MAIN_CONTRACT_STATUS_LABELS[contract.status as MainContractStatus] ?? contract.status
            }
            meta={[
              `作成: ${formatDateYYYYMMDD_HHMM(contract.created_at)}`,
              `更新: ${formatDateYYYYMMDD_HHMM(contract.updated_at)}`,
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">料金・利用状況</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">料金（税込）</p>
                  <p className="text-lg font-semibold">
                    ¥{contract.price_including_tax.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">休会時請求額</span>
                  <span className="text-sm font-semibold">
                    ¥{contract.suspension_fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground text-xs">有効契約</span>
                  <span className="text-sm font-semibold">
                    {contract.active_contracts.toLocaleString()}名
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">適用店舗</span>
                  <span className="text-sm font-semibold">
                    {contract.enabled_stores}/{contract.total_stores}店舗
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Network className="text-muted-foreground size-4" />
                契約マスタの関係
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">親主契約</p>
                  {contract.parent_contract_name ? (
                    <span className="text-primary cursor-default text-sm underline underline-offset-2">
                      {contract.parent_contract_name}
                      {contract.parent_contract_id ? `（${contract.parent_contract_id}）` : ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">―</span>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">
                    派生マスタ（{contract.child_contracts.length}件）
                  </p>
                  {contract.child_contracts.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {contract.child_contracts.map((child) => (
                        <span
                          key={child.id}
                          className="text-primary cursor-default text-sm underline underline-offset-2"
                        >
                          {child.name}（{child.id}）
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">―</span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground text-xs">現在の契約者数</span>
                  <span className="text-sm font-semibold">
                    {contract.active_contracts.toLocaleString()}名
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
