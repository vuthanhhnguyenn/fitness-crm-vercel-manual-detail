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
  update(id: string, input: UpdateFranchiseCompanyBody): FranchiseCompanyDetail | undefined;
  delete(id: string): boolean;
};
