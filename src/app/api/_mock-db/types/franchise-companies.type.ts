import type {
  CreateFranchiseCompanyBody,
  FranchiseCompanyDetail,
  FranchiseCompanyHistoryItem,
  UpdateFranchiseCompanyBody,
} from '@/app/api/_schemas/franchise-company.schema';

import type { FranchiseCompanyRow } from '../seeds/user.seed';

export type FranchiseCompaniesType = {
  _rows: FranchiseCompanyRow[];
  _historyById: Record<string, FranchiseCompanyHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(): FranchiseCompanyRow[];
  getById(id: string): FranchiseCompanyRow | undefined;
  getHistory(id: string): FranchiseCompanyHistoryItem[];
  create(input: CreateFranchiseCompanyBody): FranchiseCompanyDetail;
  update(
    id: string,
    input: UpdateFranchiseCompanyBody,
    operator?: string,
  ): FranchiseCompanyDetail | undefined;
  delete(id: string, operator?: string): boolean;
  appendHistoryEntry(
    id: string,
    entry: { changed_item: string; before: string | null; after: string | null },
    operator: string,
  ): void;
};
