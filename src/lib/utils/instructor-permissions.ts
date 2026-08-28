import type { StaffRole } from '@/lib/api/types.gen';

export type InstructorEditableField =
  | 'nickname'
  | 'romaji_last_name'
  | 'romaji_first_name'
  | 'profile_text'
  | 'photo_url'
  | 'instructing_history'
  | 'buffer_settings';

const TRAINER_SELF_EDITABLE_FIELDS: InstructorEditableField[] = [
  'nickname',
  'romaji_last_name',
  'romaji_first_name',
  'profile_text',
  'photo_url',
  'instructing_history',
  'buffer_settings',
];

/**
 * Authorization matrix for instructor management actions (data-model.md `InstructorActionPermissions`).
 */
export function canPerformInstructorAction(
  role: StaffRole,
  action: 'register' | 'edit' | 'delete',
  context?: { isSelf: boolean },
): boolean {
  switch (action) {
    case 'register':
      return role === 'system' || role === 'headquarter' || role === 'manager' || role === 'staff';
    case 'edit':
      if (role === 'system' || role === 'headquarter' || role === 'manager' || role === 'staff') {
        return true;
      }
      if (role === 'trainer') {
        return context?.isSelf === true;
      }
      return false;
    case 'delete':
      return role === 'system' || role === 'headquarter' || role === 'manager';
    default:
      return false;
  }
}

/**
 * Fields the caller may change on a given instructor record.
 * `'all'` means every field is editable; otherwise only the listed fields apply.
 */
export function getEditableFields(
  role: StaffRole,
  isSelf: boolean,
): 'all' | InstructorEditableField[] {
  if (role === 'system' || role === 'headquarter' || role === 'manager' || role === 'staff') {
    return 'all';
  }
  if (role === 'trainer' && isSelf) {
    return TRAINER_SELF_EDITABLE_FIELDS;
  }
  return [];
}

/**
 * Data-scope predicate for instructor list/detail/mutation routes (FR-005):
 * System/Headquarter → all; Manager → managed stores; Staff/Observer → own store; Trainer → self only.
 */
export function resolveInstructorDataScope(
  role: StaffRole,
  context: { callerInstructorId?: string; managedStoreIds?: string[]; ownStoreId?: string },
): (instructor: { instructor_id: string; store_id?: string | null }) => boolean {
  if (role === 'system' || role === 'headquarter') {
    return () => true;
  }
  if (role === 'manager') {
    const managedStoreIds = context.managedStoreIds ?? [];
    return (instructor) =>
      instructor.store_id != null && managedStoreIds.includes(instructor.store_id);
  }
  if (role === 'staff' || role === 'observer') {
    const ownStoreId = context.ownStoreId;
    return (instructor) => ownStoreId != null && instructor.store_id === ownStoreId;
  }
  if (role === 'trainer') {
    const callerInstructorId = context.callerInstructorId;
    return (instructor) =>
      callerInstructorId != null && instructor.instructor_id === callerInstructorId;
  }
  return () => false;
}
