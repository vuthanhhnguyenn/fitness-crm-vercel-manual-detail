import type { StaffDetail, StaffListItem } from '@/app/api/_schemas/staff.schema';

export type StaffsType = {
  _staffs: StaffListItem[];
  _details: Record<string, StaffDetail>;
  _seeded: boolean;
  _seed(): void;
  getList(): StaffListItem[];
  getById(id: string): StaffListItem | undefined;
  getDetailById(id: string): StaffDetail | undefined;
  updateDetail(id: string, patch: Partial<StaffDetail>): StaffDetail | undefined;
  create(input: { email: string; role: StaffListItem['role']; brand?: string }): StaffListItem;
  delete(id: string): boolean;
};
