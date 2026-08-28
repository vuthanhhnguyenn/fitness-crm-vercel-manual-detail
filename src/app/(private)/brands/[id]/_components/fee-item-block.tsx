import { CalendarClock } from 'lucide-react';

import type { BrandFeeGroup, BrandFeeItem } from '../_types/brand-fee.type';
import { formatYen, toCircledNumeral } from '../_utils/brand-fee.util';
import { FeeCurrentBadge } from './fee-current-badge';

export function FeeItemBlock({
  feeItem,
  itemNumber,
  status,
}: {
  feeItem: BrandFeeItem;
  itemNumber: number;
  status: BrandFeeGroup['status'];
}) {
  return (
    <div className="border-t px-4 pt-1 pb-3 first:border-t-0">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs leading-5 font-semibold wrap-break-word">
          費用項目{toCircledNumeral(itemNumber)}: {feeItem.item_name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground text-xs leading-5 font-medium">現行設定</p>
          <FeeCurrentBadge status={status} />
        </div>
        <div className="mt-2 flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-[220px]">
            <p className="text-muted-foreground mb-1 text-xs font-medium">定価（税込）</p>
            <p className="text-sm leading-7 font-bold">
              {formatYen(feeItem.current_value_including_tax_yen)}
            </p>
          </div>

          <div className="min-w-[220px] lg:text-right">
            <p className="text-muted-foreground mb-1 text-xs">有効開始日</p>
            <p className="text-[14px] leading-7 font-medium">{feeItem.effective_start_date}</p>
          </div>
        </div>
      </div>

      {feeItem.scheduled_changes.length > 0 && (
        <div className="mt-4">
          <div className="mb-2.5 flex items-center gap-2">
            <CalendarClock className="text-muted-foreground size-3.5" />
            <p className="text-xs font-medium text-slate-700">予約中の改定</p>
            <span className="rounded-full bg-slate-200 px-2 py-0 text-[10px] font-medium text-slate-700">
              {feeItem.scheduled_changes.length}件
            </span>
          </div>

          <div className="space-y-2.5">
            {feeItem.scheduled_changes.map((change) => (
              <div
                key={`${change.effective_start_date}-${change.registered_at}`}
                className="rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-1.5 py-0 text-[10px] leading-5 font-semibold text-slate-700">
                        予約
                      </span>
                      <p className="font-semibold text-slate-700">
                        {change.effective_start_date} 以降適用
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-[15px] leading-6 font-bold text-slate-900">
                    {formatYen(change.value_including_tax_yen)}
                  </p>
                </div>

                <p className="text-muted-foreground mt-1.5 text-xs leading-5">
                  登録: {change.registered_at} / {change.registered_by}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
