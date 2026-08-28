import type {
  CreateStaffsItem,
  StaffDetail,
  StaffLinkage,
  StaffListItem,
  StaffPermissionHistoryEntry,
} from '@/app/api/_schemas/staff.schema';

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
  createBatch(input: {
    staff: CreateStaffsItem[];
    role: StaffListItem['role'];
    position_id?: number;
    staff_linkage?: StaffLinkage;
    note?: string;
  }): StaffListItem[];
  delete(id: string): boolean;
  softDelete(id: string): boolean;
  deactivate(
    id: string,
    reason: string | undefined,
    operator: {
      name: string;
      position: string;
    },
  ): StaffDetail | undefined;
  activate(id: string, operator: { name: string; position: string }): StaffDetail | undefined;
  resendInvite(id: string): StaffDetail | undefined;
  recordPermissionChange(
    staff_id: string,
    change_description: string,
    operator: { name: string; position: string },
  ): void;
  getPermissionHistory(staff_id: string): StaffPermissionHistoryEntry[];
};
