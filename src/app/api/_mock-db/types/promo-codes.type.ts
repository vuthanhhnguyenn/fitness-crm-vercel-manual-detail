import type { PromoCodeRecord, PromoCodeUpsertBody } from '@/app/api/_schemas/promo-code.schema';

export type PromoCodesType = {
  _rows: PromoCodeRecord[];
  _seeded: boolean;
  _seed(): void;
  getList(): PromoCodeRecord[];
  getListByCampaignId(campaignId: string): PromoCodeRecord[];
  getByCode(code: string): PromoCodeRecord | undefined;
  add(data: PromoCodeUpsertBody): PromoCodeRecord;
  updateByCode(code: string, patch: Partial<PromoCodeRecord>): PromoCodeRecord | undefined;
};
