'use client';

import { useFormContext } from 'react-hook-form';

import { formatDateYYYYMMDD } from '@/utils/date.util';

import { Field } from '@/components/common/field';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { MainContractStatus } from '@/lib/api/types.gen';

import {
  MAIN_CONTRACT_BRAND_LABELS,
  MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS,
  MAIN_CONTRACT_STATUS_BADGE_CLASSES,
  MAIN_CONTRACT_TYPE_BADGE_CLASSES,
  MAIN_CONTRACT_TYPE_LABELS,
} from '../_constants/constants';
import type { ContractFormValues } from '../_schemas/contract-form.schema';

export function ContractFormConfirmation() {
  const form = useFormContext<ContractFormValues>();
  const values = form.getValues();

  const contractTypeLabel = values.contract_type
    ? MAIN_CONTRACT_TYPE_LABELS[values.contract_type]
    : '―';
  const brandLabel = values.brand ? MAIN_CONTRACT_BRAND_LABELS[values.brand] : '―';
  const otherStoreLabel = values.other_store_usage
    ? MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS[values.other_store_usage]
    : '―';
  const startDateFormatted = formatDateYYYYMMDD(values.start_date, '―');

  return (
    <div className="flex flex-col gap-6">
      <div className="border-info/20 bg-info/10 rounded-lg border px-4 py-3">
        <p className="text-info text-sm">
          入力内容を確認してください。問題がなければ「登録」ボタンを押してください。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 px-4">
          <Field label="主契約名" value={values.name || '―'} />
          <Field
            label="コード"
            value={values.code ? <span className="font-mono">{values.code}</span> : '―'}
          />
          <Field
            label="契約タイプ"
            value={
              values.contract_type ? (
                <Badge
                  variant="outline"
                  className={`w-fit text-[10px] ${MAIN_CONTRACT_TYPE_BADGE_CLASSES[values.contract_type]}`}
                >
                  {contractTypeLabel}
                </Badge>
              ) : (
                '―'
              )
            }
          />
          <Field label="他店舗利用可否" value={otherStoreLabel} />
          <Field label="ブランド" value={brandLabel} />
          <Field label="会員公開用主契約名" value={values.public_name || '―'} />
          <Field
            label="同伴特典"
            value={
              <Badge
                variant="outline"
                className={`w-fit text-[10px] ${
                  values.companion_benefit_enabled
                    ? 'bg-success/15 text-success border-success/20'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {values.companion_benefit_enabled ? 'あり' : 'なし'}
              </Badge>
            }
          />
          <Field
            label="ステータス"
            value={
              <Badge
                variant="outline"
                className={`w-fit text-[10px] ${MAIN_CONTRACT_STATUS_BADGE_CLASSES[values.status ?? MainContractStatus.ACTIVE]}`}
              >
                {values.status === MainContractStatus.ACTIVE ? '有効' : '無効'}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">料金・条件</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 px-4">
          <Field
            label="料金（税込）"
            value={
              values.price_including_tax != null
                ? `¥${values.price_including_tax.toLocaleString()}`
                : '―'
            }
          />
          <Field
            label="休会時請求金額"
            value={
              values.suspension_fee != null ? `¥${values.suspension_fee.toLocaleString()}` : '―'
            }
          />
          <Field label="税率" value={values.tax_rate != null ? `${values.tax_rate}%` : '―'} />
          <Field
            label="会計コード"
            value={
              values.accounting_code ? (
                <span className="font-mono">{values.accounting_code}</span>
              ) : (
                '―'
              )
            }
          />
          <Field label="利用開始日" value={startDateFormatted} />
          <Field
            label="回数上限"
            value={values.monthly_limit != null ? `${values.monthly_limit}回` : '制限なし'}
          />
          <Field label="休会可能月" value={values.suspendable_months || '―'} />
          <Field label="退会可能月" value={values.cancellable_months || '―'} />
          <Field
            label="初回支払月数"
            value={
              values.initial_payment_months != null ? `${values.initial_payment_months}ヶ月` : '―'
            }
          />
        </CardContent>
      </Card>

      {values.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">説明</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-sm whitespace-pre-wrap">{values.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
