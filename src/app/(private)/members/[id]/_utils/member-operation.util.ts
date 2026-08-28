/** Shared helpers for the member-detail header operations (A-01-01-b). */
import { isBefore, parse } from 'date-fns';

import type { WithdrawalType } from '@/lib/api/types.gen';

/**
 * A-01 FR-014: the withdrawal type is derived, never chosen by the operator — 入会取消 while the
 * contract's usage has not begun, 通常退会 once it has. Used by the 退会申請 form to pick the
 * date rule and to tell the operator which one the submission will register as.
 */
export function deriveWithdrawalType(
  scheduledDate: string,
  usageStartDate: string | undefined,
): WithdrawalType {
  if (!usageStartDate || !scheduledDate) return 'normal';
  return isBefore(
    parse(scheduledDate, 'yyyy-MM-dd', new Date()),
    parse(usageStartDate.slice(0, 10), 'yyyy-MM-dd', new Date()),
  )
    ? 'cancellation'
    : 'normal';
}
