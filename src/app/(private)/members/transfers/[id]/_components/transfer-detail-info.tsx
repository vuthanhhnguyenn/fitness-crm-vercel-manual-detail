import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { BrandBadge } from '@/components/common/brand-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Brand, TransferDetail } from '@/lib/api/types.gen';

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

/**
 * 移籍情報 card. Field set and order follow the V0 exactly (PAR051). The member's identity and
 * the origin store live in the head-up card directly above, so repeating them here would only
 * add noise.
 */
export function TransferDetailInfo({ transfer }: Readonly<{ transfer: TransferDetail }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">移籍情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="申請ID">
            <span className="font-mono">{transfer.id}</span>
          </Field>

          <Field label="移籍先店舗">{transfer.to_store_name}</Field>

          <div className="col-span-2">
            <p className="text-muted-foreground mb-1 text-xs">移籍理由</p>
            <p className="text-sm">{transfer.reason}</p>
          </div>

          <Field label="移籍希望日">{formatDateYYYYMMDD(transfer.scheduled_date)}</Field>

          <Field label="ブランド">
            <BrandBadge brand={transfer.brand as Brand} />
          </Field>

          <Field label="申請者">
            {transfer.applicant_name}
            <span className="text-muted-foreground ml-1 text-xs">({transfer.applicant_role})</span>
          </Field>

          <Field label="申請日時">{formatDateYYYYMMDD_HHMM(transfer.applied_at)}</Field>
        </div>
      </CardContent>
    </Card>
  );
}
