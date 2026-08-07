import type {
  BrandChangeHistoryItem,
  BrandDetail,
  BrandFeeGroup,
  BrandListItem,
  CreateBrandRequest,
  UpdateBrandFeeGroupRequest,
  UpdateBrandRequest,
} from '@/app/api/_schemas/brand.schema';

export type BrandsType = {
  _rows: BrandDetail[];
  _feeGroups: BrandFeeGroup[];
  _changeHistories: Array<BrandChangeHistoryItem & { brand_code: string }>;
  _seeded: boolean;
  _seed(): void;
  getList(): BrandListItem[];
  getByCode(code: string): BrandDetail | undefined;
  getByBrandId(brandId: string): BrandDetail | undefined;
  getFeesByCode(code: string): BrandFeeGroup[];
  getFeeGroup(code: string, subBrandCode: string): BrandFeeGroup | undefined;
  getChangeHistoryByCode(code: string): BrandChangeHistoryItem[];
  add(input: CreateBrandRequest): BrandDetail;
  update(code: string, patch: UpdateBrandRequest): BrandDetail | undefined;
  updateFeeGroup(
    code: string,
    subBrandCode: string,
    patch: UpdateBrandFeeGroupRequest,
  ): BrandFeeGroup | undefined;
  disableFeeGroup(code: string, subBrandCode: string): BrandFeeGroup | undefined;
  deleteFeeGroup(code: string, subBrandCode: string): boolean;
};
