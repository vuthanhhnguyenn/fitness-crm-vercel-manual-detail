import type { StoreAccessSettings } from '@/app/api/_schemas/store-access-settings.schema';

export type StoreAccessSettingsType = {
  _byStoreId: Record<string, StoreAccessSettings>;
  _seeded: boolean;
  _seed(): void;
  getByStoreId(storeId: string): StoreAccessSettings | undefined;
  replaceForStore(storeId: string, data: StoreAccessSettings): StoreAccessSettings | undefined;
};
