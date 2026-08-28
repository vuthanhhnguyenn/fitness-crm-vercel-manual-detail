import type { StaffRole } from '@/lib/api/types.gen';

export type RefundRequesterRole = 'staff' | 'manager' | 'headquarter';

/**
 * Hierarchical refund-approval rule (F-01 FR-016, research.md §5): System always approves;
 * Headquarter approves Staff/Manager requests; Manager approves Staff requests only;
 * Staff/Trainer/Observer never approve. Mirrors `pages/sales-refund-list.tsx`'s
 * client-side `canApproveRefund` exactly — this is the server-enforced source of truth.
 */
export function canApproveRefund(
  currentRole: StaffRole,
  requesterRole: RefundRequesterRole,
): boolean {
  if (currentRole === 'system') return true;
  if (currentRole === 'headquarter')
    return requesterRole === 'staff' || requesterRole === 'manager';
  if (currentRole === 'manager') return requesterRole === 'staff';
  return false;
}

/** Display label for the approver level a given requester role requires. */
export function requiredApproverLabel(requesterRole: RefundRequesterRole): string {
  if (requesterRole === 'staff') return 'Manager以上';
  if (requesterRole === 'manager') return '本部（Headquarter）以上';
  return 'System管理者のみ';
}
