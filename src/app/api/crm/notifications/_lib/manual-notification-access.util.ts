import { type AuthenticatedUser, getAllowedStoreIds } from '@/app/api/_lib/auth';
import type { ManualNotificationTarget } from '@/app/api/_schemas/manual-notification.schema';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, type UserRole } from '@/types/permission.type';

import {
  getManualNotificationTargetStoreIds,
  manualNotificationTargetToInput,
} from './manual-notification-upsert.util';

type ManualNotificationReadScope = {
  createdByUserId: string;
  recipientScopeStoreIds: string[] | null;
  targetStoreIds: string[];
  target: ManualNotificationTarget;
  status?: string;
};

export function canReadManualNotification(
  user: AuthenticatedUser,
  notification: ManualNotificationReadScope,
): boolean {
  if (!hasPermissions(user.role as UserRole, [Permission.ManualNotificationsView])) return false;
  // TODO(phase-2): the I-03 approval flow treats drafts/returned as
  // creator-private (HQ/System can still read). A future approval-only
  // reviewer role may need read access even for drafts; revisit when the
  // Observer scope is finalized.
  if (
    (notification.status === 'draft' || notification.status === 'returned') &&
    user.id !== notification.createdByUserId &&
    user.role !== 'Headquarter' &&
    user.role !== 'System'
  ) {
    return false;
  }

  if (user.role === 'Manager') return true;

  const allowedStoreIds = getAllowedStoreIds(user);
  if (allowedStoreIds === null) return true;
  if (allowedStoreIds.length === 0) return false;
  const targetStoreIds = notification.targetStoreIds.length
    ? notification.targetStoreIds
    : getManualNotificationTargetStoreIds(
        manualNotificationTargetToInput(notification.target),
        notification.recipientScopeStoreIds,
      );

  return (
    notification.createdByUserId === user.id ||
    targetStoreIds.some((storeId) => allowedStoreIds.includes(storeId))
  );
}

export function canWriteManualNotification(
  user: AuthenticatedUser,
  notification: ManualNotificationReadScope,
): boolean {
  if (!canReadManualNotification(user, notification)) return false;
  if (user.role === 'Headquarter' || user.role === 'System') return true;
  if (user.id === notification.createdByUserId) return true;

  if (user.role === 'Manager') return true; // I-03: Manager scope is all stores/brands

  return false;
}

/**
 * Store scope used when validating a write target. Manager is deliberately
 * unrestricted — I-03 treats the Manager scope as all stores/brands (see
 * `canWriteManualNotification` above) — while every other writable role is
 * scoped to their own stores. System / Headquarter already resolve to `null`
 * inside `getAllowedStoreIds`.
 */
export function getManualNotificationValidationScope(user: AuthenticatedUser): string[] | null {
  if (user.role === 'Manager') return null;
  return getAllowedStoreIds(user);
}
