import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { TransferRequest } from '@/lib/api/types.gen';

import { EXCLUSION_BADGE_LABELS } from '../_constants/constants';

type AutoBadgeTransfer = Pick<
  TransferRequest,
  'brand' | 'auto_transfer_eligible' | 'exclusion_reasons' | 'unpaid_amount'
> & {
  campaign_lock_remaining_days: TransferRequest['campaign_lock_remaining_days'];
};

/**
 * 自動移籍可否 cell (FR-006).
 *
 * FIT365 has no automatic transfer at all, so it renders an em dash rather than a "not eligible"
 * badge — the distinction matters, because "excluded" is an actionable state and "not applicable"
 * is not. Both exclusion reasons can hold at once and are stacked.
 */
export function TransferAutoBadge({ transfer }: Readonly<{ transfer: AutoBadgeTransfer }>) {
  if (transfer.brand !== 'joyfit' || transfer.auto_transfer_eligible === null) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  if (transfer.auto_transfer_eligible) {
    return (
      <Badge variant="outline" className="bg-success/15 text-success border-success/20 text-[10px]">
        自動可
      </Badge>
    );
  }

  const reasons = transfer.exclusion_reasons;

  return (
    <div className="flex flex-col gap-1">
      {reasons.includes('unpaid') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Badge
                variant="outline"
                className="bg-destructive/15 text-destructive border-destructive/20 w-fit cursor-default text-[10px]"
              >
                {EXCLUSION_BADGE_LABELS.unpaid}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">未納金: ¥{(transfer.unpaid_amount ?? 0).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {reasons.includes('campaign_lock') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Badge
                variant="outline"
                className="bg-warning/15 text-warning border-warning/20 w-fit cursor-default text-[10px]"
              >
                {EXCLUSION_BADGE_LABELS.campaign_lock}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">残り {transfer.campaign_lock_remaining_days ?? 0}日</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
