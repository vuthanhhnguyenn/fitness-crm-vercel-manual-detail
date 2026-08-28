import { BRAND_OPTIONS } from '@/app/(private)/brands/_constants/brand.constants';

import { BannerChannel, BannerStatus, BrandEnum } from '@/lib/api/types.gen';

export const BANNER_DEFAULT_PAGE_SIZE = 50;

export const BRAND_ALL_VALUE = 'ALL';

export type BannerBrandSelectValue = BrandEnum | typeof BRAND_ALL_VALUE;

export const BANNER_BRAND_OPTIONS: Array<{
  id: BannerBrandSelectValue;
  label: string;
}> = [{ id: BRAND_ALL_VALUE, label: 'JOYFIT全体' }, ...BRAND_OPTIONS];

export const BANNER_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const BANNER_SORT_FIELDS = ['order', 'title', 'status'];

export const BANNER_STATUS_LABELS: Record<BannerStatus, string> = {
  [BannerStatus.PUBLISHED]: '公開中',
  [BannerStatus.OUT_OF_PERIOD]: '期間外',
  [BannerStatus.DRAFT]: '非公開',
};

export const BANNER_STATUS_BADGE_CLASSES: Record<BannerStatus, string> = {
  [BannerStatus.PUBLISHED]: 'bg-success/15 text-success border-success/20',
  [BannerStatus.OUT_OF_PERIOD]: 'bg-warning/15 text-warning border-warning/20',
  [BannerStatus.DRAFT]: 'bg-muted text-muted-foreground border-border',
};

export const BANNER_CHANNEL_LABELS: Record<BannerChannel, string> = {
  [BannerChannel.WEB]: 'WEBサイト',
  [BannerChannel.MOBILE]: 'モバイルアプリ',
};

export const getTableMaxHeightClass = (isFilterOpen: boolean, hasActiveFilters: boolean) => {
  if (isFilterOpen) {
    return hasActiveFilters ? 'max-h-[calc(100vh-372px)]' : 'max-h-[calc(100vh-314px)]';
  }

  return hasActiveFilters ? 'max-h-[calc(100vh-328px)]' : 'max-h-[calc(100vh-270px)]';
};
