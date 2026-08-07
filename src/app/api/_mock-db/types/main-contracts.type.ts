import type {
  MainContractChangeHistoryItem,
  MainContractDetail,
  MainContractListItem,
} from '@/app/api/_schemas/main-contract.schema';

export type MainContractsType = {
  _rows: MainContractListItem[];
  _details: Record<string, MainContractDetail>;
  _changeHistory: Record<string, MainContractChangeHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(): MainContractListItem[];
  getById(id: string): MainContractDetail | undefined;
  getChangeHistory(id: string): MainContractChangeHistoryItem[];
  delete(id: string): boolean;
  add(contract: MainContractDetail): void;
  update(id: string, data: Partial<MainContractDetail>): MainContractDetail | undefined;
};
