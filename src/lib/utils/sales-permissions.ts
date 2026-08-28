import type { StaffRole } from '@/lib/api/types.gen';

export type SalesAction =
  | 'confirm'
  | 'refund'
  | 'line-item-add'
  | 'fee-adjust'
  | 'manual-register'
  | 'export'
  | 'download-file';

/**
 * Authorization matrix for Sales Management actions (data-model.md `SalesActionPermissions`).
 * Staff confirmation is delegated per-staff via `staff_permissions` (research.md §3), not a
 * static role grant — callers must resolve `hasDelegatedConfirmPermission` themselves by
 * checking the caller's `staff_permissions` for an `'F-01.confirm'`-style code.
 */
export function canPerformSalesAction(
  role: StaffRole,
  action: SalesAction,
  context?: { hasDelegatedConfirmPermission?: boolean },
): boolean {
  switch (action) {
    case 'confirm':
      if (role === 'system' || role === 'headquarter' || role === 'manager') return true;
      if (role === 'staff') return context?.hasDelegatedConfirmPermission === true;
      return false;
    case 'export':
      return role === 'system' || role === 'headquarter' || role === 'manager';
    case 'refund':
    case 'line-item-add':
    case 'fee-adjust':
    case 'manual-register':
    case 'download-file':
      return role === 'system' || role === 'headquarter' || role === 'manager' || role === 'staff';
    default:
      return false;
  }
}

/**
 * Data-scope predicate for sales/billing list/detail/mutation routes (FR-006):
 * System/Headquarter → all; Manager → managed stores; Staff → own store; Trainer/Observer → none.
 */
export function resolveSalesDataScope(
  role: StaffRole,
  context: { managedStoreIds?: string[]; ownStoreId?: string },
): (record: { store_id: string }) => boolean {
  if (role === 'system' || role === 'headquarter') {
    return () => true;
  }
  if (role === 'manager') {
    const managedStoreIds = context.managedStoreIds ?? [];
    return (record) => managedStoreIds.includes(record.store_id);
  }
  if (role === 'staff') {
    const ownStoreId = context.ownStoreId;
    return (record) => ownStoreId != null && record.store_id === ownStoreId;
  }
  return () => false;
}
