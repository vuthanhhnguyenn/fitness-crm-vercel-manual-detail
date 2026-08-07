import type { StaffRole } from '../_constants/constants';

type PositionRoleCategory = 'headquarter' | 'manager' | 'staff' | 'trainer' | 'observer';

/** 職位マスターのロール区分 → スタッフ編集権限（PATCH permission_settings.role） */
export function staffRoleFromPositionRoleCategory(role: PositionRoleCategory): StaffRole {
  switch (role) {
    case 'headquarter':
      return 'headquarter';
    case 'observer':
      return 'observer';
    case 'manager':
      return 'manager';
    case 'staff':
      return 'staff';
    case 'trainer':
      return 'trainer';
    default:
      return 'staff';
  }
}
