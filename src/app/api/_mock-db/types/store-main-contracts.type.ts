import type { StoreLinkedMainContract } from '@/app/api/_schemas/store-sales-settings.schema';

export type StoreMainContractsType = {
  _rows: Array<{ store_id: string; main_contract_id: string; linked_at: string }>;
  _seeded: boolean;
  _seed(): void;
  listByStoreId(storeId: string): StoreLinkedMainContract[];
  addByStoreId(storeId: string, mainContractIds: string[]): StoreLinkedMainContract[];
  removeByStoreId(storeId: string, mainContractId: string): boolean;
};
