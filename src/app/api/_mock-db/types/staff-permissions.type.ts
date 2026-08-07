import type { StaffPermissionRecord } from '@/app/api/_schemas/position.schema';

export type StaffPermissionsType = {
  getByStaffId(staff_id: string): StaffPermissionRecord[];
  removeForStaff(staff_id: string): void;
  replaceForStaff(staff_id: string, rows: Array<{ permission_code: string }>): void;
};
