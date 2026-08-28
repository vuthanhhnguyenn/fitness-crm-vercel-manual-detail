import { ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { BillingRecordDetail } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

const BILLING_TYPE_LABELS: Record<BillingRecordDetail['billing_type'], string> = {
  monthly: '月次請求',
  ad_hoc: '都度請求',
  manual: '手動請求',
};

const PAYMENT_METHOD_LABELS: Record<BillingRecordDetail['payment_method'], string> = {
  sbps: 'SBPS',
  jaccs: 'JACCS',
  cash: '現金',
  other: 'その他',
};

function ReadOnlyField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

interface BillingBasicInfoCardProps {
  record: BillingRecordDetail;
}

export function BillingBasicInfoCard({ record }: Readonly<BillingBasicInfoCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <ReadOnlyField label="請求ID" value={record.id} mono />
          <ReadOnlyField label="請求日" value={record.billing_date} />
          <ReadOnlyField label="店舗" value={record.store_name} />
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">利用者</p>
            <p className="text-sm font-medium">
              <a
                href={navigate('/members/[id]', record.member_id)}
                className="text-primary inline-flex items-center gap-0.5 align-middle underline-offset-2 hover:underline"
              >
                {record.member_name}
                <ArrowUpRight className="size-3" />
              </a>
              <span className="text-muted-foreground font-normal">（ID: {record.member_id}）</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">請求区分</p>
            <Badge variant="secondary" className="text-xs font-normal">
              {BILLING_TYPE_LABELS[record.billing_type]}
            </Badge>
          </div>
          <ReadOnlyField label="決済手段" value={PAYMENT_METHOD_LABELS[record.payment_method]} />
          <div className="col-span-2 space-y-1">
            <p className="text-muted-foreground text-xs">備考</p>
            <p className="text-sm leading-relaxed">{record.notes || '—'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
