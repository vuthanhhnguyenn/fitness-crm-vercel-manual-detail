'use client';

import { Field } from '@/components/common/field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { GetCrmMainContractsByIdResponse } from '@/lib/api/types.gen';

type ContractDetail = NonNullable<GetCrmMainContractsByIdResponse>['main_contract'];

interface PricingTabProps {
  contract: ContractDetail;
}

export function PricingTab({ contract }: PricingTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">料金</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field
              label="料金（税込）"
              value={
                <span className="text-lg font-semibold">
                  ¥{contract.price_including_tax.toLocaleString()}
                </span>
              }
            />
            <Field
              label="休会時請求金額（税込）"
              value={`¥${contract.suspension_fee.toLocaleString()}`}
            />
            <Field label="税率" value={`${contract.tax_rate}%`} />
            <Field label="会計コード" value={contract.accounting_code} mono />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">利用条件</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field label="利用開始日" value={contract.start_date} />
            <Field
              label="月額会員回数上限"
              value={contract.monthly_limit != null ? `${contract.monthly_limit}回/月` : '制限なし'}
            />
            <Field
              label="休会中月利用回数"
              value={
                contract.suspension_monthly_limit != null
                  ? `${contract.suspension_monthly_limit}回/月`
                  : '制限なし'
              }
            />
          </div>
          <div className="mt-4 border-t pt-4">
            <Label className="text-muted-foreground mb-2 block text-xs">
              利用可能時間（曜日別）
            </Label>
            <div className="flex flex-col gap-2">
              {contract.usage_hours_by_day.map((d) => (
                <div key={d.day} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-6 shrink-0">{d.day}</span>
                  {d.all_day ? (
                    <span className="text-success">終日（24時間）</span>
                  ) : (
                    <span className="font-mono">
                      {d.from} 〜 {d.to}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">休会・退会</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field label="休会可能月" value={contract.suspendable_months} />
            <Field label="退会可能月" value={contract.cancellable_months} />
            <Field label="初回支払月数" value={`${contract.initial_payment_months}ヶ月`} />
            <Field
              label="退会申請当月の退会"
              value={contract.same_day_cancellation ? '可' : '不可'}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">対象制限</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field label="年齢制限" value={contract.age_restriction} />
            <Field label="性別制限" value={contract.gender_restriction} />
            <Field label="家族会員契約" value={contract.family_contract_allowed ? '可' : '不可'} />
            <Field label="課金有無" value={contract.billing_enabled ? 'あり' : 'なし'} />
            <Field label="変更可否" value={contract.modifiable} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
