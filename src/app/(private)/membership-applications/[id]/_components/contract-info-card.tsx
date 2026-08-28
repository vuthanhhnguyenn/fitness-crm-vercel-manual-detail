import { formatDateYYYYMMDD } from '@/utils/date.util';
import { formatYen } from '@/utils/format.util';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { ApplicationDetail } from './membership-application.utils';

interface ContractInfoCardProps {
  app: ApplicationDetail;
}

function Field({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function ContractInfoCard({ app }: Readonly<ContractInfoCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">契約情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field
            label="ブランド"
            value={
              <Badge variant="outline" className="text-[10px]">
                {app.brand_name}
              </Badge>
            }
          />
          <Field label="入会店舗" value={app.store_name} />
          <Field label="プラン名" value={app.plan_name} />
          <Field label="月額料金" value={formatYen(app.monthly_fee)} />
          <Field
            label="先払い期間"
            value={
              <span>
                {app.prepayment_months}ヶ月
                <span className="text-muted-foreground ml-2 text-xs">
                  （{app.prepayment_rule_label}）
                </span>
              </span>
            }
          />
          <Field label="契約開始日" value={formatDateYYYYMMDD(app.contract_start_date)} />
          <Field label="利用開始日" value={formatDateYYYYMMDD(app.usage_start_date)} />
          {app.campaign_name && (
            <Field
              label="適用キャンペーン"
              value={
                <Badge
                  variant="outline"
                  className="bg-info/15 text-info border-info/20 text-[10px]"
                >
                  {app.campaign_name}
                </Badge>
              }
            />
          )}
          <div className="col-span-2">
            <Field
              label="選択オプション"
              value={
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {app.options.length > 0 ? (
                    app.options.map((opt) => (
                      <Badge key={opt} variant="outline" className="text-[10px]">
                        {opt}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">なし</span>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
