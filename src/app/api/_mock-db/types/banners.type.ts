import type {
  Banner,
  BannerBrandMapEntry,
  BannerDisplayOrderItem,
  CreateBannerBody,
  UpdateBannerBody,
} from '@/app/api/_schemas/banner.schema';
import { BrandEnum } from '@/app/api/_schemas/brand.schema';

export type BannersType = {
  _rows: Banner[];
  _seeded: boolean;
  _seed(): void;
  getBrandEnum(bannerId: string): BrandEnum[];
  getList(): Banner[];
  getById(id: string): Banner | undefined;
  add(data: CreateBannerBody): Banner;
  update(id: string, data: UpdateBannerBody): Banner | null;
  delete(id: string): boolean;
  updateDisplayOrder(input: BannerDisplayOrderItem[]): BannerDisplayOrderItem[] | null;
};

export type BannerBrandMapTable = {
  _rows: BannerBrandMapEntry[];
  getByBannerId(bannerId: string): BrandEnum[];
  setByBannerId(bannerId: string, brandIds: BrandEnum[]): void;
  deleteByBannerId(bannerId: string): void;
};
