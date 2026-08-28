import type {
  CreateTermsBody,
  GetTermsQuery,
  Terms,
  UpdateTermsBody,
} from '@/app/api/_schemas/terms.schema';

export type TermsRow = Terms;

export type TermsCreateResult = TermsRow | 'invalid_lineage_ref';
export type TermsUpdateResult = TermsRow | 'not_found';
export type TermsDeleteResult = 'not_found' | true;

export type TermsType = {
  _rows: TermsRow[];
  _seeded: boolean;
  _seed(): void;
  list(
    query: GetTermsQuery,
    brandScope: TermsRow['brand_enum'] | null,
  ): { rows: TermsRow[]; total: number; totalAllItems: number };
  getById(id: string, brandScope: TermsRow['brand_enum'] | null): TermsRow | undefined | null;
  create(data: CreateTermsBody, createdBy: string): TermsCreateResult;
  update(id: string, patch: UpdateTermsBody, updatedBy: string): TermsUpdateResult;
  delete(id: string): TermsDeleteResult;
};
