import type {
  ActiveTermsItem,
  BrandLabel,
  CreateTermsBody,
  CreateTermsVersionBody,
  GetActiveTermsQuery,
  InternalTermsType,
  RecordTermsConsentBody,
  TermsConsentRecord,
  TermsDetail,
  TermsListQuery,
  TermsListResponse,
  UpdateTermsBody,
} from '@/app/api/_schemas/terms.schema';

export type TermsRow = {
  id: string;
  parentTermsId: string | null;
  prevTermsId: string | null;
  termsType: InternalTermsType;
  brandEnum: BrandLabel;
  title: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  displayOrder: string | null;
  requiresConsent: boolean;
  remarks: string | null;
  bodyText: string;
  pdfS3Key: string;
  pdfUrl: string | null;
  pdfFileName: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string;
  deletedAt: string | null;
};

export type TermsConsentRow = TermsConsentRecord;

export type TermsType = {
  _rows: TermsRow[];
  _consents: TermsConsentRow[];
  _seeded: boolean;
  _seed(): void;
  list(query: TermsListQuery): TermsListResponse;
  getById(id: string): TermsRow | undefined;
  getDetail(id: string): TermsDetail | undefined;
  createOriginal(input: CreateTermsBody): TermsRow;
  createVersion(id: string, input: CreateTermsVersionBody): TermsRow | undefined;
  update(id: string, input: UpdateTermsBody): TermsRow | undefined;
  logicalDelete(id: string): TermsRow | undefined;
  recordConsents(input: RecordTermsConsentBody): number;
  getActive(query: GetActiveTermsQuery): ActiveTermsItem[];
};
