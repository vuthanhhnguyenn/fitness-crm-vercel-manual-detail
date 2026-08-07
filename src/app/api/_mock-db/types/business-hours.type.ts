import type { StoreBusinessHours } from '@/app/api/_schemas/store.schema';

export type BusinessHoursType = {
  _rows: StoreBusinessHours[];
  _seeded: boolean;
  _seed(): void;
  getByStoreId(storeId: string): StoreBusinessHours | undefined;
  upsert(storeId: string, patch: Partial<Omit<StoreBusinessHours, 'store_id'>>): StoreBusinessHours;
};
