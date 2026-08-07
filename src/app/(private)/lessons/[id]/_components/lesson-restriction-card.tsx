import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLessonContentsByIdResponse } from '@/lib/api/types.gen';

type LessonDetail = NonNullable<GetCrmLessonContentsByIdResponse>['data'];

interface LessonRestrictionCardProps {
  detail: LessonDetail;
}

function ContractRow({ label, contracts }: { label: string; contracts: string[] }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-muted-foreground shrink-0 text-xs">{label}</span>
      {contracts.length === 0 ? (
        <span className="text-sm">制限なし</span>
      ) : (
        <div className="flex flex-wrap justify-end gap-1">
          {contracts.map((c) => (
            <Badge key={c} variant="secondary" className="text-[11px]">
              {c}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * "制限・料金" card — restricted main/option contracts (or 制限なし) and the
 * per-use fee row only when pricing is 有料（都次） (FR-003-P1-04).
 */
export function LessonRestrictionCard({ detail }: LessonRestrictionCardProps) {
  const isPaid = detail.pricing_type === 'paid';
  const perUseFee = detail.per_use_fee ?? detail.restriction.per_use_fee ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">制限・料金</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <ContractRow
            label="制限主契約"
            contracts={detail.restriction.restricted_main_contracts}
          />
          <ContractRow
            label="制限オプション契約"
            contracts={detail.restriction.restricted_option_contracts}
          />
          {isPaid && perUseFee !== null && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-xs">都度利用料金（税込）</span>
              <span className="text-sm font-semibold">¥{perUseFee.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
