import { BrandEnum } from '@/lib/api/types.gen';

export const BRAND_OPTIONS = [
  { id: BrandEnum.JOYFIT, label: 'JOYFIT' },
  { id: BrandEnum.JOYFIT24, label: 'JOYFIT24' },
  { id: BrandEnum.JOYFIT_YOGA, label: 'JOYFIT YOGA' },
  { id: BrandEnum.JOYFIT_PLUS, label: 'JOYFIT+' },
  { id: BrandEnum.FIT365, label: 'FIT365' },
];

export type BrandOption = (typeof BRAND_OPTIONS)[number];

export const BRAND_LABELS: Record<BrandEnum, string> = {
  [BrandEnum.JOYFIT]: 'JOYFIT',
  [BrandEnum.JOYFIT24]: 'JOYFIT24',
  [BrandEnum.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [BrandEnum.JOYFIT_PLUS]: 'JOYFIT+',
  [BrandEnum.FIT365]: 'FIT365',
};
