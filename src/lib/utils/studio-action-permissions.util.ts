import type { StaffRole } from '@/lib/api/types.gen';

/**
 * Authorization matrix for studio detail page actions.
 * Defines which roles can perform which actions.
 */
const ACTION_PERMISSION_MATRIX: Record<StaffRole, Record<string, boolean>> = {
  system: {
    view: true,
    edit: true,
    delete: true,
  },
  headquarter: {
    view: true,
    edit: true,
    delete: true,
  },
  manager: {
    view: true,
    edit: true,
    delete: true,
  },
  staff: {
    view: true,
    edit: true,
    delete: false,
  },
  trainer: {
    view: true,
    edit: false,
    delete: false,
  },
  observer: {
    view: true,
    edit: false,
    delete: false,
  },
};

/**
 * Checks if a user role can perform a specific action on a studio.
 * @param role User role
 * @param action Action to check (view, edit, delete)
 * @returns true if action is allowed, false otherwise
 */
export function canPerformAction(role: StaffRole, action: string): boolean {
  const permissions = ACTION_PERMISSION_MATRIX[role];
  return permissions?.[action] ?? false;
}

/**
 * Checks if user can view studio details.
 */
export function canViewStudio(role: StaffRole): boolean {
  return canPerformAction(role, 'view');
}

/**
 * Checks if user can edit studio.
 */
export function canEditStudio(role: StaffRole): boolean {
  return canPerformAction(role, 'edit');
}

/**
 * Checks if user can delete studio.
 */
export function canDeleteStudio(role: StaffRole): boolean {
  return canPerformAction(role, 'delete');
}

/**
 * Checks if delete action is blocked due to studio being in use.
 * @param assignedLessonCount Number of lessons assigned to studio
 * @returns true if delete is blocked, false otherwise
 */
export function isDeleteBlocked(assignedLessonCount: number): boolean {
  return assignedLessonCount > 0;
}
