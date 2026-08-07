import type { Store } from '@/app/api/_schemas/store.schema';

export type StoresType = {
  _rows: Store[];
  _seeded: boolean;
  _seed(): void;
  getList(): Store[];
  getById(id: string): Store | undefined;
  create(input: Omit<Store, 'id' | 'store_id' | 'created_at' | 'updated_at'>): Store;
  updateById(id: string, patch: Partial<Store>): Store | undefined;
  setManagerStaff(storeId: string, manager_staff_id: string | null): void;
};
