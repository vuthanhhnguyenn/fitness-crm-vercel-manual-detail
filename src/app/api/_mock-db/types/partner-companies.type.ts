import type { CorporateMasterRow } from '../seeds/franchise.seed';

export type PartnerCompaniesType = {
  _rows: CorporateMasterRow[];
  _seeded: boolean;
  _seed(): void;
  getAll(): CorporateMasterRow[];
};
