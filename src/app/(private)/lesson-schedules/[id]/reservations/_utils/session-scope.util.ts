import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import { type AuthUser, UserRole } from '@/types/permission.type';

/**
 * D-01 permission matrix: Trainer is scoped to only their own sessions for
 * schedule-edit/reservation/attendance/memo actions. Every other role that
 * already holds the base permission is unrestricted.
 */
export function isOwnSessionScope(
  user: AuthUser | null,
  schedule: Pick<LessonScheduleListItem, 'instructor_id'>,
): boolean {
  if (!user) return false;
  if (user.role !== UserRole.Trainer) return true;
  return user.id === schedule.instructor_id;
}

const MANAGE_ROLES = [
  UserRole.System,
  UserRole.Headquarter,
  UserRole.Manager,
  UserRole.Staff,
  UserRole.Trainer,
];

/** Roles allowed for a manage-permission RoleGatedButton, scoped by own-session for Trainer. */
export function scopedManageRoles(isOwnSession: boolean): UserRole[] {
  return isOwnSession ? MANAGE_ROLES : MANAGE_ROLES.filter((role) => role !== UserRole.Trainer);
}
