import type { EnrollmentFeeMasterRow } from '../seeds/user.seed';

export type EnrollmentFeeMastersType = {
  _rows: EnrollmentFeeMasterRow[];
  _seeded: boolean;
  _seed(): void;
  getAll(): EnrollmentFeeMasterRow[];
  getFiltered(brand?: string, applicationType?: string): EnrollmentFeeMasterRow[];
};
