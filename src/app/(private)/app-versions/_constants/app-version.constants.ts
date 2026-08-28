import { AppVersionBrandEnum } from '@/lib/api/types.gen';

export const DEFAULT_PAGE_SIZE = 20;

export const BRAND_BADGE_CLASSES: Record<AppVersionBrandEnum, string> = {
  [AppVersionBrandEnum.JOYFIT]: 'bg-primary/15 text-primary border-primary/20',
  [AppVersionBrandEnum.FIT365]: 'bg-destructive/15 text-destructive border-destructive/20',
};

export const APP_VERSION_BRAND_LABELS: Record<AppVersionBrandEnum, string> = {
  [AppVersionBrandEnum.JOYFIT]: 'JOYFIT',
  [AppVersionBrandEnum.FIT365]: 'FIT365',
};
