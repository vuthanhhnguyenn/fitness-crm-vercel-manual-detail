import { type AuthenticatedUser, getAllowedStoreIds } from '@/app/api/_lib/auth';
import { hasPermissions } from '@/utils/permission.util';

import { Permission, type UserRole } from '@/types/permission.type';

type ManualNotificationReadScope = {
  createdByUserId: string;
  targetStoreIds: string[];
};

export function canReadManualNotification(
  user: AuthenticatedUser,
  notification: ManualNotificationReadScope,
): boolean {
  if (!hasPermissions(user.role as UserRole, [Permission.ManualNotificationsView])) return false;

  const allowedStoreIds = getAllowedStoreIds(user);
  if (allowedStoreIds === null) return true;
  if (allowedStoreIds.length === 0) return false;

  return (
    notification.createdByUserId === user.id ||
    notification.targetStoreIds.some((storeId) => allowedStoreIds.includes(storeId))
  );
}
