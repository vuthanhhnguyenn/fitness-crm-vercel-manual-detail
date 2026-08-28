import type { GetCrmBrandsByIdFeesResponse } from '@/lib/api/types.gen';

export type BrandFeeGroup = GetCrmBrandsByIdFeesResponse['fee_groups'][number];
export type BrandFeeItem = BrandFeeGroup['fee_items'][number];
