import { PAGE_PERMISSIONS, ROLE_PERMISSIONS } from '@/constants/permission.constants';

import type { RoutePattern } from '@/lib/routes/routes.type';

import { Permission, UserRole } from '@/types/permission.type';

/**
 * Returns true if the given role holds the permission required to view the route.
 * Routes not listed in PAGE_PERMISSIONS are unrestricted — any authenticated role can access.
 */
export function canRoleAccessPage(role: UserRole, pattern: RoutePattern): boolean {
  const required = PAGE_PERMISSIONS[pattern];
  if (!required) return true; // not restricted
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(required);
}

/**
 * Returns true if the given role holds all of the specified permissions.
 */
export function hasPermissions(role: UserRole, permissions: readonly Permission[]): boolean {
  const granted = ROLE_PERMISSIONS[role] as readonly Permission[];
  return permissions.every((p) => granted.includes(p));
}

/**
 * Returns true if the given route is restricted to Headquarter/System only.
 * Determined by checking whether only those two roles hold the required page-view permission.
 */
export function isPageHqOnly(pattern: RoutePattern): boolean {
  const required = PAGE_PERMISSIONS[pattern];
  if (!required) return false;
  const accessibleRoles = Object.values(UserRole).filter((role) =>
    (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(required),
  );
  return (
    accessibleRoles.length > 0 &&
    accessibleRoles.every((r) => r === UserRole.System || r === UserRole.Headquarter)
  );
}
