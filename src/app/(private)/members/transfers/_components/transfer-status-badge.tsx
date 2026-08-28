import { Badge } from '@/components/ui/badge';

import type { TransferStatus } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  TRANSFER_STATUS_CLASSES,
  TRANSFER_STATUS_DOT_CLASSES,
  TRANSFER_STATUS_LABELS,
  shouldShowTransferStatusDot,
} from '../_constants/constants';

/**
 * Shared by the list column and the detail header so the two can never disagree.
 *
 * 完了 renders as a plain `secondary` badge with no dot; every other status is an outline badge
 * with a colour-matched live-state dot. All labels/classes come from `_constants/constants.ts`,
 * and `TransferStatus` comes from `types.gen.ts` — this component used to hand-declare its own
 * status union, which is exactly how it kept the removed `approved` state alive.
 */
export function TransferStatusBadge({
  status,
  className,
  size = 'md',
}: Readonly<{ status: TransferStatus; className?: string; size?: 'sm' | 'md' }>) {
  const textClass = size === 'sm' ? 'text-[10px]' : 'text-xs';

  if (!shouldShowTransferStatusDot(status)) {
    return (
      <Badge variant="secondary" className={cn(textClass, 'font-medium', className)}>
        {TRANSFER_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium', textClass, TRANSFER_STATUS_CLASSES[status], className)}
    >
      <span className={cn('size-1.5 rounded-full', TRANSFER_STATUS_DOT_CLASSES[status])} />
      {TRANSFER_STATUS_LABELS[status]}
    </Badge>
  );
}
