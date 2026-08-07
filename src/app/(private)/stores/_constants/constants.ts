import { StoreArea, StoreListBrand, StoreListStatus } from '@/lib/api/types.gen';

export { StoreArea, StoreListBrand, StoreListStatus } from '@/lib/api/types.gen';

export const STORE_BRAND_LABELS: Record<StoreListBrand, string> = {
  [StoreListBrand.JOYFIT]: 'JOYFIT',
  [StoreListBrand.FIT365]: 'FIT365',
  [StoreListBrand.JOYFIT24]: 'JOYFIT24',
  [StoreListBrand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [StoreListBrand.JOYFIT_PLUS]: 'JOYFIT+',
};

/** Badge styles — Tailwind palette (no raw hex) */
export const STORE_BRAND_BADGE_CLASSES: Record<StoreListBrand, string> = {
  [StoreListBrand.JOYFIT]: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  [StoreListBrand.FIT365]: 'bg-pink-100 text-pink-700 border-pink-200',
  [StoreListBrand.JOYFIT24]: 'bg-blue-100 text-blue-800 border-blue-200',
  [StoreListBrand.JOYFIT_YOGA]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [StoreListBrand.JOYFIT_PLUS]: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const STORE_AREA_LABELS: Record<StoreArea, string> = {
  [StoreArea.KANTO]: '関東',
  [StoreArea.KANSAI]: '関西',
  [StoreArea.CHUBU]: '中部',
  [StoreArea.OTHER]: 'その他',
};

export const STORE_STATUS_LABELS: Record<StoreListStatus, string> = {
  [StoreListStatus.OPERATING]: '営業中',
  [StoreListStatus.PREPARING]: '準備中',
  [StoreListStatus.CLOSED_TEMP]: '休業中',
  [StoreListStatus.CLOSED_PERM]: '閉店',
};

export const STORE_STATUS_BADGE_CLASSES: Record<StoreListStatus, string> = {
  [StoreListStatus.OPERATING]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [StoreListStatus.PREPARING]: 'bg-sky-100 text-sky-700 border-sky-200',
  [StoreListStatus.CLOSED_TEMP]: 'bg-orange-100 text-orange-700 border-orange-200',
  [StoreListStatus.CLOSED_PERM]: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};
