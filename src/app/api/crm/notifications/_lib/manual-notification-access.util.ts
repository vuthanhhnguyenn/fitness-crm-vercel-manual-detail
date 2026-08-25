import { type AuthenticatedUser, getAllowedStoreIds } from '@/app/api/_lib/auth';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, type UserRole } from '@/types/permission.type';

type ManualNotificationReadScope = {
  createdByUserId: string;
  targetStoreIds: string[];
  status?: string;
};

export function canReadManualNotification(
  user: AuthenticatedUser,
  notification: ManualNotificationReadScope,
): boolean {
  if (!hasPermissions(user.role as UserRole, [Permission.ManualNotificationsView])) return false;
  if (
    (notification.status === 'draft' || notification.status === 'returned') &&
    user.id !== notification.createdByUserId &&
    user.role !== 'Headquarter' &&
    user.role !== 'System'
  ) {
    return false;
  }

  const allowedStoreIds = getAllowedStoreIds(user);
  if (allowedStoreIds === null) return true;
  if (allowedStoreIds.length === 0) return false;

  return (
    notification.createdByUserId === user.id ||
    notification.targetStoreIds.some((storeId) => allowedStoreIds.includes(storeId))
  );
}

export function canWriteManualNotification(
  user: AuthenticatedUser,
  notification: ManualNotificationReadScope,
  creatorStoreId?: string | null,
): boolean {
  if (!canReadManualNotification(user, notification)) return false;
  if (user.role === 'Headquarter' || user.role === 'System') return true;
  if (user.id === notification.createdByUserId) return true;

  if (user.role === 'Manager') {
    const managerStoreIds = getAllowedStoreIds(user);
    if (!managerStoreIds || !creatorStoreId) return false;
    return managerStoreIds.includes(creatorStoreId);
  }

  return false;
}
