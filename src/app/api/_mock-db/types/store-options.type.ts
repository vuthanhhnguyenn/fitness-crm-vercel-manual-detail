import type { StoreLinkedOption } from '@/app/api/_schemas/store-sales-settings.schema';

export type StoreOptionsType = {
  _rows: Array<{ store_id: string; option_id: string; linked_at: string }>;
  _seeded: boolean;
  _seed(): void;
  listByStoreId(storeId: string): StoreLinkedOption[];
  addByStoreId(storeId: string, optionIds: string[]): StoreLinkedOption[];
  removeByStoreId(storeId: string, optionId: string): boolean;
};
