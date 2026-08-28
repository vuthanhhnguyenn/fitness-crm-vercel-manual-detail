import type { PromoCodeRow } from '@/app/api/_schemas/promo-code.schema';

export type PromoCodesType = {
  _rows: PromoCodeRow[];
  _seeded: boolean;
  _seed(): void;
  getList(): PromoCodeRow[];
  getListByCampaignId(campaignId: string): PromoCodeRow[];
  getById(id: string): PromoCodeRow | undefined;
  getByCode(code: string): PromoCodeRow | undefined;
  nextId(): string;
  create(row: PromoCodeRow): PromoCodeRow;
  update(id: string, patch: Partial<PromoCodeRow>): PromoCodeRow | undefined;
  countActiveByCampaignId(campaignId: string): number;
  hasAnyByCampaignId(campaignId: string): boolean;
};
